// sweep_worker.js
//
// Runs chunks of the 1- or 2-variable sweep (computeSweepRow, via solveAim /
// find_power) off the main thread so multiple CPU cores can be used at once.
//
// Design notes:
//  - This worker just importScripts()s the *same* smart_calculator.js used by
//    the page, so the physics/solver code lives in exactly one place and can
//    never drift between the UI thread and the workers. Nothing at the top
//    level of that file touches `document`/`window` (only individual function
//    bodies do, and none of those functions are called from here), so loading
//    it in a worker context is safe.
//  - find_power()/solveAim() lean on a few module-level singletons (`ball`,
//    `club`, `wind`) that get mutated during a solve. That's fine: each
//    Worker is its own JS realm with its own copy of those singletons, so
//    concurrent workers never touch each other's state. Everything here runs
//    strictly one row at a time within a single worker.
//  - postMessage() structured-clones its payload, which silently drops
//    function properties and object prototypes. Two places in the params can
//    carry those:
//      * power_player.options.total is a function -> reattached below.
//      * a "slope" fixed value can be a Vector3D instance (when the user
//        enters "x,y,z" for a fixed slope) -> re-instantiated below.
//    Everything else on the params (plain numbers, club_info's plain fields,
//    etc.) survives the clone untouched.

importScripts('smart_calculator.js');

function reviveFixedParams(fixedParams) {
    if (fixedParams.slope && typeof fixedParams.slope === 'object' && !(fixedParams.slope instanceof Vector3D)) {
        fixedParams.slope = new Vector3D(fixedParams.slope.x, fixedParams.slope.y, fixedParams.slope.z);
    }

    const opts = fixedParams.power_player && fixedParams.power_player.options;
    if (opts && typeof opts.total !== 'function') {
        opts.total = function (option) {
            let pwr = this.auxpart + this.mascot + this.card;
            if (option == 1 || option == 2 || option == 3)
                pwr += this.ps_auxpart + this.ps_mascot + this.ps_card;
            return pwr;
        };
    }

    return fixedParams;
}

self.onmessage = function (e) {
    const job = e.data;

    try {
        const fixedParams = reviveFixedParams(job.fixedParams);

        // Mirrors the baseline computation sweepOneVariable() does on the main
        // thread: solved once (per task here, redundantly across the chunks of
        // the same block, but it's a single cheap solve and always yields the
        // same deterministic result) whenever the swept range spans 0.
        let baseline = null;
        if (job.needBaseline) {
            const baseParams = Object.assign({}, fixedParams);
            baseParams[job.varKey] = 0;
            const solvedBase = solveAim(baseParams);
            if (solvedBase.success)
                baseline = toDisplayRow(baseParams, solvedBase, job.dis, job.aimX);
        }

        const rows = [];
        let success = 0, failure = 0;
        let lastReported = 0;

        for (let i = 0; i < job.values.length; i++) {
            const value = job.values[i];
            const row = computeSweepRow(fixedParams, job.varKey, value, job.dis, job.aimX, baseline, job.includeSensitivity);
            rows.push(row);
            if (row.success) success++; else failure++;

            // Throttle progress messages so postMessage traffic doesn't dominate
            // on very fast rows -- report at least every 5 rows and always on
            // the last one.
            if ((i + 1) - lastReported >= 5 || i === job.values.length - 1) {
                lastReported = i + 1;
                self.postMessage({ type: 'progress', taskId: job.taskId, completed: i + 1 });
            }
        }

        self.postMessage({
            type: 'done',
            taskId: job.taskId,
            blockIndex: job.blockIndex,
            startIndex: job.startIndex,
            rows,
            success,
            failure,
        });
    } catch (err) {
        self.postMessage({
            type: 'error',
            taskId: job.taskId,
            message: (err && err.message) || String(err),
        });
    }
};
