// physics_worker.js
// Runs one independent copy of the pure physics engine (physics_engine.js)
// inside a dedicated Web Worker thread. The main thread (smart_calculator.js)
// spins up a small pool of these and hands each one a share of the sweep
// rows, so the AIM-refinement solve for each row (which is CPU-bound and
// fully independent of every other row) runs in parallel across CPU cores
// instead of one row at a time on the UI thread.
//
// Each worker gets its own module-level `ball` / `club` / `wind` singletons
// (they're declared inside physics_engine.js and this file loads its own
// copy via importScripts), so there is no shared mutable state between
// workers and no race conditions -- every worker only ever mutates its own
// copies while it works through the rows it's been assigned.

importScripts('physics_engine.js');

// power_player.options.total is a function, which can't cross postMessage's
// structured-clone boundary. The main thread only ever sends the plain
// numeric fields; rebuild the same shape (incl. the `total` method) here.
function rebuildPowerPlayer(data) {
    return {
        pwr: data.pwr,
        options: {
            auxpart: data.options.auxpart,
            mascot: data.options.mascot,
            card: data.options.card,
            ps_auxpart: data.options.ps_auxpart,
            ps_mascot: data.options.ps_mascot,
            ps_card: data.options.ps_card,
            total: function (option) {
                let pwr = this.auxpart + this.mascot + this.card;
                if (option == 1 || option == 2 || option == 3)
                    pwr += this.ps_auxpart + this.ps_mascot + this.ps_card;
                return pwr;
            }
        }
    };
}

// Mirrors the per-row body of the sweep loop in calc() (smart_calculator.js),
// exactly, so parallelizing it changes nothing about the numbers produced.
function computeRow(task) {
    const { club, shot, power_shot, params, sweepKey, sweepValue, HWIMultiplier, aim, baselinePow, baselineHwi } = task;

    const power_player = rebuildPowerPlayer(task.power_player);

    const p = Object.assign({}, params);
    p[sweepKey] = sweepValue;

    const r = solveShot(power_player, club, shot, power_shot,
        p.distance, p.height, p.wind, p.degree, p.ground, p.spin, p.curve, p.slope);

    if (!r.ok)
        return { ok: false };

    const hwi = (desvioByDegree(r.desvio, p.distance) / 0.2167) * HWIMultiplier;
    const powY = r.power_range * r.power;

    const effectiveCrosswind = p.wind * Math.abs(Math.sin((p.degree * Math.PI / 180) - r.aim));

    return {
        ok: true,
        power: r.power * 100,
        hwi: hwi,
        hwiaim: (aim !== 1) ? (hwi / aim) : null,
        shotpower: powY,
        deltaPow: (baselinePow !== null) ? (powY - baselinePow) : null,
        hRate: (baselinePow !== null && sweepValue !== 0 && sweepKey === 'height')
            ? (powY - baselinePow) / sweepValue : null,
        deltaHwi: (baselineHwi !== null) ? (hwi - baselineHwi) : null,
        hwiAdj: (baselineHwi !== null && effectiveCrosswind !== 0 && sweepKey === 'height')
            ? (hwi - baselineHwi) / (effectiveCrosswind * Math.abs(sweepValue)) : null,
        hwiNorm: (effectiveCrosswind !== 0) ? (hwi / effectiveCrosswind) : null,
        windEffDiff: computeWindEffDiff(power_player, club, shot, power_shot, p),
        powDiff: computeHeightPowDiff(power_player, club, shot, power_shot, p, r.aim),
        hwiDiff: computeWindHwiDiff(power_player, club, shot, power_shot, p, HWIMultiplier),
        hwiHeightDiff: computeHeightHwiDiff(power_player, club, shot, power_shot, p, HWIMultiplier),
    };
}

self.onmessage = function (e) {
    const task = e.data;
    try {
        const result = computeRow(task);
        self.postMessage({ index: task.index, result: result });
    } catch (err) {
        // Report the failure as a normal "not ok" row rather than crashing the
        // worker -- one bad row (e.g. a pathological aim search) shouldn't take
        // down the whole sweep.
        self.postMessage({ index: task.index, result: { ok: false }, error: String(err && err.message || err) });
    }
};
