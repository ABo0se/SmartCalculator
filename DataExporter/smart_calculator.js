// Arquivo smart_calculator.js
// Criado em 31/08/2020 as 18:21 por Acrisio
// Algoritmo que calcula o lançamento obliquo com resistência do meio e o efeito magnus.
// Obtido atraves de engenharia reversa do pangya.
//
// NOTE: the pure physics engine (Vector3D/Ball/Club/Wind/QuadTree/find_power),
// desvioByDegree, solveShot, and the numerical-derivative "Diff" helpers used
// to live in this file. They've been moved to physics_engine.js so the exact
// same code can be loaded both here (main thread) and inside the Web Workers
// used to parallelize the sweep in calc() below. Make sure physics_engine.js
// is included via <script> BEFORE this file in index.htm.

function checkValidInput(value) {
    if (value == null || value.trim() === '')
        return 0;

    const number = Number(value);

    return Number.isNaN(number) ? 0 : number;
}

function checkValidInputSlope(value) {

    if (value === '')
        return 0;

    if (isNaN(value)) {

        const split = value.split(',');

        if (split.length !== 3 ||
            isNaN(split[0]) ||
            isNaN(split[1]) ||
            isNaN(split[2]))
            return 0;

        return new Vector3D(
            Number(split[0]) * slope_break_to_curve_slope,
            Number(split[1]) * Math.PI / 180,
            Number(split[2]) * slope_break_to_curve_slope
        );
    }

    return Number(value);
}

function calcMycella(el) {

    const align_degree = checkValidInput(document.querySelector('#mycella>#align-degree').value);
    const px = checkValidInput(document.querySelector('#mycella>#px').value);
    const slope_side = checkValidInput(document.querySelector('#mycella>#slope-side').value);
    const x_slope = checkValidInput(document.querySelector('#mycella>#x-slope').value);

    const slope_real = Math.abs((Math.cos(Math.abs(Math.PI  / 180 * (align_degree)))) * (px / 30.7));

    document.getElementById('slope1').value = ((slope_real * x_slope) * slope_side).toFixed(4);
}

function checkdrive(el) {

    const power_value = checkValidInput(document.querySelector('#power').value);
    const ring_value = checkValidInput(document.querySelector('#auxpart_pwr').value);
    const lolo_value = checkValidInput(document.querySelector('#card_ps_pwr').value);

    const drivecal = 200 + power_value * 2 + ring_value;

    document.getElementById('current_drive').value = `${drivecal}+${lolo_value}`;

}

function checkdriveExcel(el) {

    const power_value = checkValidInput(document.querySelector('#power').value);
    const ring_value = checkValidInput(document.querySelector('#auxpart_pwr').value);
    const lolo_value = checkValidInput(document.querySelector('#card_ps_pwr').value);

    const drivecal = 200 + power_value * 2 + ring_value;

    return `${drivecal}+${lolo_value}`;

}

function anglecalc1(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = angle90;

    document.getElementById('degree1').value = angle360.toFixed(2);

}

function anglecalc2(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 180 - angle90;

    document.getElementById('degree1').value = angle360.toFixed(2);

}

function anglecalc3(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 180 + angle90;

    document.getElementById('degree1').value = angle360.toFixed(2);

}

function anglecalc4(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 360 - angle90;

    document.getElementById('degree1').value = angle360.toFixed(2);

}


// desvioByDegree now lives in index.htm (see the note at the top of this file)
class DataInformation
{
    // Data
    distancestart = 0;
    distanceend = 0;
    heightstart = 0;
    heightend = 0;
    windstart = 0;
    windend = 0;
    winddegstart = 0;
    winddegend = 0;
    slopestart = 0;
    slopeend = 0;
    groundstart = 100;
    groundend = 0;
    spinstart = 0;
    spinend = 0;
    curvestart = 0;
    curveend = 0;

    // Flags
    // 0 = Distance
    // 1 = Height
    // 2 = Wind
    // 3 = Wind Degree
    // 4 = Slope
    // 5 = Ground
    // 6 = Spin
    // 7 = Curve
    // -1 = not defined
    datatype = -1;
    dataloopcount = 0;

    // Default
    DiffRate = 1;
    Aim = 4;
    HWIMultiplier = 1;
}

class AnswerFinder{
    // Swept-value list (whichever dimension datatype points at)
    distancelist = [];
    heightlist = [];
    windlist = [];
    slopelist = [];
    winddeglist = [];
    groundlist = [];
    spinlist = [];
    curvelist = [];

    // Answer List (parallel to whichever *list above is populated)
    powerList = [];
    hwilist = [];
    hwiaimlist = [];
    shotpowerlist = [];
    okList = []; // true/false per row, whether the solve succeeded

    // Derived analysis columns (only populated for the modes they apply to)
    deltaPowList = [];      // Pow(y) - Pow(y) at that mode's baseline. [height/wind/slope/ground/spin/curve modes]
    hRateList = [];         // deltaPow / height, i.e. ΔPow per yard of elevation. [height mode only]
    deltaHwiList = [];      // HWI - HWI at that mode's baseline. [height/wind/slope/ground/spin/curve modes]
    hwiAdjList = [];        // deltaHwi / baseline HWI. [height/wind/slope/ground/spin/curve modes]
    hwiNormList = [];       // HWI / (mag * sin(direction)) HWI. [height/wind/slope/ground/spin/curve modes]
    windEffDiffList = [];   // local centered derivative of Pow(y) w.r.t. wind, at this row's own config. [any mode]
    powDiffList = [];       // local centered derivative of Pow(y) w.r.t. height, at this row's own config. [any mode]
    hwiDiffList = [];       // local centered derivative of HWI w.r.t. wind, at this row's own config. [any mode]
    hwiHeightDiffList = [];       // local centered derivative of HWI w.r.t. height, at this row's own config. [any mode]
}

//Functions
function tickCheckBox(box)
{
    const Containers = document.querySelectorAll('.container-grid-fivecolumn');

    for (const container of Containers)
    {
        const CheckBox = container.querySelector('.databool');
        const DestinationData = container.querySelector('.destinationdata');
        if (box == CheckBox && box.checked)
        {
            DestinationData.disabled = false;
        }
        else
        {
            CheckBox.checked = false;
            DestinationData.disabled = true;
            DestinationData.value = "";
        }
    }
}

// Human-readable label + list-field name for each swept dimension, used both to build
// the sweep values and to label the exported spreadsheet's first column.
const DATATYPE_INFO = [
    { label: 'Distance',    listField: 'distancelist', startField: 'distancestart', endField: 'distanceend' },
    { label: 'Height',      listField: 'heightlist',   startField: 'heightstart',   endField: 'heightend' },
    { label: 'Wind',            listField: 'windlist',     startField: 'windstart',     endField: 'windend' },
    { label: 'Wind Degree',     listField: 'winddeglist',  startField: 'winddegstart',  endField: 'winddegend' },
    { label: 'Slope',           listField: 'slopelist',    startField: 'slopestart',    endField: 'slopeend' },
    { label: 'Ground Effect',   listField: 'groundlist',   startField: 'groundstart',   endField: 'groundend' },
    { label: 'Spin',            listField: 'spinlist',     startField: 'spinstart',     endField: 'spinend' },
    { label: 'Curve',           listField: 'curvelist',    startField: 'curvestart',    endField: 'curveend' },
];

function GetAnswer()
{
    //MainCalcFunction
    let mydata = new DataInformation();
    let myanswer = new AnswerFinder();
    mydata.distancestart = checkValidInput(document.getElementById("distance1").value);
    mydata.distanceend = checkValidInput(document.getElementById("distance2").value);
    mydata.heightstart = checkValidInput(document.getElementById("height1").value);
    mydata.heightend = checkValidInput(document.getElementById("height2").value);
    mydata.windstart = checkValidInput(document.getElementById("wind1").value);
    mydata.windend = checkValidInput(document.getElementById("wind2").value);
    mydata.winddegstart = checkValidInput(document.getElementById("degree1").value);
    mydata.winddegend = checkValidInput(document.getElementById("degree2").value);
    mydata.slopestart = checkValidInputSlope(document.getElementById("slope1").value);
    mydata.slopeend = checkValidInputSlope(document.getElementById("slope2").value);
    mydata.groundstart = checkValidInput(document.getElementById("ground1").value);
    mydata.groundend = checkValidInput(document.getElementById("ground2").value);
    mydata.spinstart = checkValidInput(document.getElementById("spin1").value);
    mydata.spinend = checkValidInput(document.getElementById("spin2").value);
    mydata.curvestart = checkValidInput(document.getElementById("curve1").value);
    mydata.curveend = checkValidInput(document.getElementById("curve2").value);
    mydata.Aim = checkValidInput(document.getElementById("aim").value);
    mydata.DiffRate = checkValidInput(document.getElementById("datafrequency").value);
    mydata.HWIMultiplier = checkValidInput(document.getElementById("dis").value);

    if (document.getElementById("distancecheckbox").checked)
    {
        mydata.datatype = 0;
    }
    else if (document.getElementById("heightcheckbox").checked)
    {
        mydata.datatype = 1;
    }
    else if (document.getElementById("windcheckbox").checked)
    {
        mydata.datatype = 2;
    }
    else if (document.getElementById("degreecheckbox").checked)
    {
        mydata.datatype = 3;
    }
    else if (document.getElementById("slope_breakcheckbox").checked)
    {
        mydata.datatype = 4;
    }
    else if (document.getElementById("groundcheckbox").checked)
    {
        mydata.datatype = 5;
    }
    else if (document.getElementById("spincheckbox").checked)
    {
        mydata.datatype = 6;
    }
    else if (document.getElementById("curvecheckbox").checked)
    {
        mydata.datatype = 7;
    }
    else
    {
        mydata.datatype = -1;
    }

    // Set Var -- DiffRate is the step size between successive swept values (not a row cap),
    // so every dimension is built the same way: start, start+DiffRate, start+2*DiffRate, ...
    // up to (but not including) end. A DiffRate <= 0 can't make progress, so treat it as "no rows".
    mydata.dataloopcount = 0;

    if (mydata.datatype >= 0 && mydata.DiffRate > 0)
    {
        const info = DATATYPE_INFO[mydata.datatype];
        const start = mydata[info.startField];
        const end = mydata[info.endField];
        const steps = Math.round(Math.abs(end - start) / mydata.DiffRate) + 1;
        const direction = end >= start ? 1 : -1;

        for (let i = 0; i < steps; i++)
        {
            const value = start + (i * mydata.DiffRate * direction);
            myanswer[info.listField].push(value);
            mydata.dataloopcount++;
        }
    }

    return { mydata, myanswer };
}

// Runs the exact same find_power + AIM-refinement pipeline AnswerFinder's calc() uses,
// factored out so it can be called once per swept value here. Returns
// { ok:false } if no solution was found, otherwise
// { ok:true, power, power_range, desvio }.

// solveShot (AIM-refinement fixed-point solver) now lives in index.htm

function showProgress(total) {
    const container = document.getElementById('progress-container');
    const fill = document.getElementById('progress-fill');
    const label = document.getElementById('progress-label');
    container.style.display = 'block';
    fill.style.width = '0%';
    label.innerHTML = `0 / ${total}`;
}

function updateProgress(current, total) {
    const fill = document.getElementById('progress-fill');
    const label = document.getElementById('progress-label');
    const pct = total > 0 ? (current / total) * 100 : 0;
    fill.style.width = `${pct}%`;
    label.innerHTML = `${current} / ${total}`;
}

function hideProgress() {
    document.getElementById('progress-container').style.display = 'none';
}

function yieldToBrowser() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

// computeWindEffDiff / computeHeightPowDiff / computeWindHwiDiff / computeHeightHwiDiff
// now live in index.htm

// ---------------------------------------------------------------------------
// Multithreaded sweep execution
//
// Each row of the sweep (one value of the swept dimension) runs the full
// AIM-refinement solve (solveShot) plus four more solves for the numerical
// derivative columns -- and every row is completely independent of every
// other row. That makes the sweep embarrassingly parallel, so instead of
// solving rows one at a time on the UI thread, calc() hands rows out to a
// small pool of Web Workers (one physics_worker.js each), which run the
// exact same physics_engine.js code on separate threads.
//
// power_player carries a `total()` method, which can't cross postMessage's
// structured-clone boundary, so only its plain numeric fields are sent; each
// worker rebuilds the method locally (see physics_worker.js).
//
// If workers can't be created or fail outright (e.g. the page is opened via
// file:// in a browser that blocks worker scripts from local files), calc()
// falls back to the original single-threaded loop automatically.
// ---------------------------------------------------------------------------

const MAX_SWEEP_WORKERS = 8;

function getSweepWorkerCount(taskCount) {
    const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
    return Math.max(1, Math.min(cores, MAX_SWEEP_WORKERS, taskCount));
}

function serializePowerPlayerForWorker(power_player) {
    return {
        pwr: power_player.pwr,
        options: {
            auxpart: power_player.options.auxpart,
            mascot: power_player.options.mascot,
            card: power_player.options.card,
            ps_auxpart: power_player.options.ps_auxpart,
            ps_mascot: power_player.options.ps_mascot,
            ps_card: power_player.options.ps_card,
        }
    };
}

// Attempts to run every task in `tasks` (each already containing an `index`)
// across a worker pool, calling onResult(index, result) as each one completes
// and onProgress(completed, total) after each completion. Resolves true on
// success; resolves false if workers couldn't be used at all, so the caller
// can fall back to running the same tasks single-threaded.
function runSweepOnWorkerPool(tasks, onResult, onProgress) {
    if (tasks.length === 0)
        return Promise.resolve(true);

    if (typeof Worker === 'undefined')
        return Promise.resolve(false);

    const workerCount = getSweepWorkerCount(tasks.length);
    let workers = [];

    try {
        for (let i = 0; i < workerCount; i++) {
            workers.push(new Worker('physics_worker.js'));
        }
    } catch (e) {
        console.warn('SmartCalculator: could not create Web Workers, falling back to single-threaded calculation.', e);
        workers.forEach(w => { try { w.terminate(); } catch (_) {} });
        return Promise.resolve(false);
    }


    return new Promise((resolve) => {
        let nextIndex = 0;
        let completed = 0;
        let settled = false;

        const cleanup = () => workers.forEach(w => { try { w.terminate(); } catch (_) {} });

        const settle = (success) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(success);
        };

        const dispatchNext = (worker) => {
            if (settled || nextIndex >= tasks.length) return;
            worker.postMessage(tasks[nextIndex++]);
        };

        workers.forEach((worker) => {
            worker.onmessage = (e) => {
                if (settled) return;
                const { index, result } = e.data;
                onResult(index, result);
                completed++;
                if (onProgress) onProgress(completed, tasks.length);
                if (completed === tasks.length) {
                    settle(true);
                } else {
                    dispatchNext(worker);
                }
            };
            worker.onerror = (err) => {
                console.warn('SmartCalculator: a sweep worker failed, falling back to single-threaded calculation.', err);
                settle(false);
            };
        });

        workers.forEach(w => dispatchNext(w));
    });
}

// Single-threaded fallback: identical math to the worker path (and to the
// original pre-multithreading loop), just run inline on the main thread.
function computeSweepRowInline(power_player, club, shot, power_shot, params, sweepKey, sweepValue, HWIMultiplier, aim, baselinePow, baselineHwi) {
    const p = { ...params };
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

// Calculation Functions
async function calc(el) {
    let power = checkValidInput(document.getElementById('power').value);
    let auxpart_pwr = checkValidInput(document.getElementById('auxpart_pwr').value);
    let card_pwr = checkValidInput(document.getElementById('card_pwr').value);
    let mascot_pwr = checkValidInput(document.getElementById('mascot_pwr').value);
    let card_ps_pwr = checkValidInput(document.getElementById('card_ps_pwr').value);

    let club = document.getElementById('club')
    club = club.options[club.selectedIndex].value
    club = CLUB_INFO[CLUB_INFO_ENUM[club]];

    let shot = document.getElementById('shot')
    shot = shot.options[shot.selectedIndex].value
    shot = SHOT_TYPE[SHOT_TYPE_ENUM[shot]];

    let power_shot = document.getElementById('power_shot')
    power_shot = power_shot.options[power_shot.selectedIndex].value
    power_shot = POWER_SHOT_FACTORY[POWER_SHOT_FACTORY_ENUM[power_shot]];

    const power_player = {
        pwr: power,
        options: {
            auxpart: auxpart_pwr,
            mascot: mascot_pwr,
            card: card_pwr,
            ps_auxpart: 0,
            ps_mascot: 0,
            ps_card: card_ps_pwr,
            total: function(option) {
                let pwr = this.auxpart + this.mascot + this.card;
                if (option == 1 || option == 2 || option == 3)
                    pwr += this.ps_auxpart + this.ps_mascot + this.ps_card;
                return pwr;
            }
        }
    };

    const { mydata, myanswer } = GetAnswer();

    const result = document.getElementById('result');

    if (mydata.datatype < 0) {
        result.style.color = 'Red';
        result.innerHTML = 'กรุณาเลือกข้อมูลที่ต้องการแจกแจง (ติ๊กถูกที่ช่องด้านซ้ายของค่าที่ต้องการ)';
        return;
    }

    if (mydata.dataloopcount <= 0) {
        result.style.color = 'Red';
        result.innerHTML = 'ไม่มีข้อมูลให้คำนวณ ตรวจสอบค่าเริ่มต้น/สิ้นสุด และค่าความห่างของข้อมูล';
        return;
    }

    const info = DATATYPE_INFO[mydata.datatype];
    const sweepValues = myanswer[info.listField];

    // Fixed value for every dimension that ISN'T the one being swept, taken from that
    // dimension's own "start" (left) field.
    const fixed = {
        distance: mydata.distancestart,
        height: mydata.heightstart,
        wind: mydata.windstart,
        degree: mydata.winddegstart,
        slope: mydata.slopestart,
        ground: mydata.groundstart,
        spin: mydata.spinstart,
        curve: mydata.curvestart,
    };
    const fixedKeyByDatatype = ['distance', 'height', 'wind', 'degree', 'slope', 'ground', 'spin', 'curve'];
    const sweepKey = fixedKeyByDatatype[mydata.datatype];

    // Canonical "zero" reference per dimension, used for ΔPow/ΔHWI/HWI Adj. Distance and
    // Wind Degree have no natural zero-reference for this purpose, so they're excluded.
    const CANONICAL_ZERO = { height: 0, wind: 0, slope: 0, ground: 100, spin: 0, curve: 0 };

    let baselinePow = null, baselineHwi = null;
    if (sweepKey in CANONICAL_ZERO) {
        const baseParams = { ...fixed, [sweepKey]: CANONICAL_ZERO[sweepKey] };
        const baseR = solveShot(power_player, club, shot, power_shot,
            baseParams.distance, baseParams.height, baseParams.wind, baseParams.degree,
            baseParams.ground, baseParams.spin, baseParams.curve, baseParams.slope);
        if (baseR.ok) {
            baselinePow = baseR.power_range * baseR.power;
            baselineHwi = (desvioByDegree(baseR.desvio, baseParams.distance) / 0.2167) * mydata.HWIMultiplier;
        }
    }

    let successCount = 0;

    const total = sweepValues.length;
    showProgress(total);

    // Pre-size every parallel array up front so results can be written in by
    // index as they arrive -- workers don't necessarily finish rows in order.
    myanswer.okList = new Array(total).fill(false);
    myanswer.powerList = new Array(total).fill(null);
    myanswer.hwilist = new Array(total).fill(null);
    if (mydata.Aim !== 1) {
        myanswer.hwiaimlist = new Array(total).fill(null);
    }
    myanswer.shotpowerlist = new Array(total).fill(null);
    myanswer.deltaPowList = new Array(total).fill(null);
    myanswer.hRateList = new Array(total).fill(null);
    myanswer.deltaHwiList = new Array(total).fill(null);
    myanswer.hwiAdjList = new Array(total).fill(null);
    myanswer.hwiNormList = new Array(total).fill(null);
    myanswer.windEffDiffList = new Array(total).fill(null);
    myanswer.powDiffList = new Array(total).fill(null);
    myanswer.hwiDiffList = new Array(total).fill(null);
    myanswer.hwiHeightDiffList = new Array(total).fill(null);

    const applyRowResult = (i, result) => {
        myanswer.okList[i] = !!(result && result.ok);

        if (result && result.ok) {
            successCount++;
            myanswer.powerList[i] = result.power;
            myanswer.hwilist[i] = result.hwi;
            if (mydata.Aim !== 1) {
                myanswer.hwiaimlist[i] = result.hwiaim;
            }
            myanswer.shotpowerlist[i] = result.shotpower;
            myanswer.deltaPowList[i] = result.deltaPow;
            myanswer.hRateList[i] = result.hRate;
            myanswer.deltaHwiList[i] = result.deltaHwi;
            myanswer.hwiAdjList[i] = result.hwiAdj;
            myanswer.hwiNormList[i] = result.hwiNorm;
            myanswer.windEffDiffList[i] = result.windEffDiff;
            myanswer.powDiffList[i] = result.powDiff;
            myanswer.hwiDiffList[i] = result.hwiDiff;
            myanswer.hwiHeightDiffList[i] = result.hwiHeightDiff;
        }
    };

    // power_player.options.total() can't be sent to a worker as-is (functions
    // don't survive structured clone); ship the plain fields instead.
    const power_player_data = serializePowerPlayerForWorker(power_player);

    const tasks = sweepValues.map((value, i) => ({
        index: i,
        power_player: power_player_data,
        club: club,
        shot: shot,
        power_shot: power_shot,
        params: fixed,
        sweepKey: sweepKey,
        sweepValue: value,
        HWIMultiplier: mydata.HWIMultiplier,
        aim: mydata.Aim,
        baselinePow: baselinePow,
        baselineHwi: baselineHwi,
    }));

    const usedWorkers = await runSweepOnWorkerPool(
        tasks,
        applyRowResult,
        (completed) => updateProgress(completed, total)
    );

    if (!usedWorkers) {
        // Fallback: same math, single-threaded, with periodic UI yields so the
        // progress bar and page stay responsive exactly like before.
        successCount = 0;
        for (let i = 0; i < sweepValues.length; i++) {
            const result = computeSweepRowInline(
                power_player, club, shot, power_shot, fixed, sweepKey, sweepValues[i],
                mydata.HWIMultiplier, mydata.Aim, baselinePow, baselineHwi
            );
            applyRowResult(i, result);
            updateProgress(i + 1, total);
            await yieldToBrowser();
        }
    }

    hideProgress();
    
    const info1 = DATATYPE_INFO[mydata.datatype];
    const start = mydata[info1.startField];
    const end = mydata[info1.endField];

    // 1. Define your designated header rows (AOA format)
    const designatedHeaderRows = [
        ['Summary', ''],
        [],
        ['ClubConf:', checkdriveExcel(this)],
        ['ClubType:', document.getElementById('club').options[document.getElementById('club').selectedIndex].text],
        ['ShotType:', document.getElementById('shot').options[document.getElementById('shot').selectedIndex].text],
        ['PowerShot:', document.getElementById('power_shot').options[document.getElementById('power_shot').selectedIndex].text],
        [],
        ['Type:', info.label],
        ['Range:', `${start} to ${end}`],
        ['Freq.:', mydata.DiffRate],
        ['X Aim:', mydata.Aim],
        ['X HWI:', mydata.HWIMultiplier],
        [],
        ['Init Val', ''],
        ['Dist:', mydata.distancestart],
        ['Height:', mydata.heightstart],
        ['Wind:', mydata.windstart],
        ['W Deg:', mydata.winddegstart],
        ['Slope:', mydata.slopestart],
        ['Spin:', mydata.spinstart],
        ['Curve:', mydata.curvestart],
        [],
        ['Steps:', sweepValues.length],
        ['Success:', myanswer.okList.filter(Boolean).length],
        ['Failure:', sweepValues.length - myanswer.okList.filter(Boolean).length],
        [],
        ['Note!'],
        ['Height Pow Diff', 'Pow(y) change per 1m on current elevation.'],
        ['Height HWI Diff', 'HWI(pb) change per 1m on current elevation.'],
        ['Wind Pow Diff', 'Pow(y) change per 1m/s on current wind.'],
        ['Wind HWI Diff', 'HWI(pb) change per 1m/s on current crosswind scale.'],
        ['HWI Norm.', 'HWI(pb) normalized by effective crosswind.'],
        []
    ];

    // 2. Build your table data rows (rows 22+)
    const rows = sweepValues.map((v, i) => ({
        [info.label]: v,
        'Pow (%)': myanswer.okList[i] ? Number(myanswer.powerList[i].toFixed(3)) : '-',
        'Pow (y)': myanswer.okList[i] ? Number(myanswer.shotpowerlist[i].toFixed(3)) : '-',
        // ΔPow/ΔHWI/HWI Adj only make sense for modes with a natural "zero" reference
        // (height/wind/slope/ground/spin/curve) -- not distance or wind degree.
        ...(baselinePow !== null && {
            'ΔPow': (myanswer.okList[i] && myanswer.deltaPowList[i] !== null) ? Number(myanswer.deltaPowList[i].toFixed(3)) : '-',
        }),

        ...(baselinePow !== null && sweepKey === 'height' && {
            'H': (myanswer.okList[i] && myanswer.hRateList[i] !== null) ? Number(myanswer.hRateList[i].toFixed(4)) : '-',
        }),

        // Pow Diff = Pow (y) diff per 1m elevation, computed as a local numerical derivative
        // at this row's own height (see computeHeightPowDiff). [Any mode]
        'Height Pow Diff': (myanswer.okList[i] && myanswer.powDiffList[i] !== null) ? Number(myanswer.powDiffList[i].toFixed(4)) : '-',

        ...(mydata.Aim !== 1 && {
        'AIM': myanswer.okList[i] ? Number(myanswer.hwiaimlist[i].toFixed(4)) : '-'
        }),

        'HWI': myanswer.okList[i] ? Number(myanswer.hwilist[i].toFixed(4)) : '-',

        ...(baselineHwi !== null && {
            'ΔHWI': (myanswer.okList[i] && myanswer.deltaHwiList[i] !== null) ? Number(myanswer.deltaHwiList[i].toFixed(4)) : '-',
        }),

        'HWI Norm.': myanswer.okList[i] && myanswer.hwiNormList[i] !== null ? Number(myanswer.hwiNormList[i].toFixed(4)) : '-',

        ...(baselineHwi !== null && sweepKey === 'height' && {
            'HWI Adj': (myanswer.okList[i] && myanswer.hwiAdjList[i] !== null) ? Number(myanswer.hwiAdjList[i].toFixed(4)) : '-',
        }),

        // HWI Adj Diff = HWI Adj diff per 1m elevation, computed as a local numerical derivative at
        // this row's own elevation (see computeWindHwiDiff). [Any mode]
        'Height HWI Diff': (myanswer.okList[i] && myanswer.hwiHeightDiffList[i] !== null) ? Number(myanswer.hwiHeightDiffList[i].toFixed(4)) : '-',

        // Wind Eff Diff = Pow (y) diff per 1 m/s wind, computed as a local numerical
        // derivative at this row's own wind/degree (see computeWindEffDiff). [Any mode]
        'Wind Pow Diff': (myanswer.okList[i] && myanswer.windEffDiffList[i] !== null) ? Number(myanswer.windEffDiffList[i].toFixed(4)) : '-',
        
        // HWI Diff = HWI diff per 1 m/s wind, computed as a local numerical derivative at
        // this row's own wind/degree (see computeWindHwiDiff). [Any mode]
        'Wind HWI Diff': (myanswer.okList[i] && myanswer.hwiDiffList[i] !== null) ? Number(myanswer.hwiDiffList[i].toFixed(4)) : '-',
        
    }));

    // 3. Create worksheet using raw values
// 1. Create sheet from raw headers
const worksheet = XLSX.utils.aoa_to_sheet(designatedHeaderRows);

// 2. Set explicit numerical merge bounds
worksheet['!merges'] = designatedHeaderRows.map((_, r) => ({
    s: { r: r, c: 1 },  // Start at Column B
    e: { r: r, c: 10 }  // End at Column K
}));

// 3. Append JSON table rows below headers
XLSX.utils.sheet_add_json(
    worksheet,
    rows,
    { origin: `A${designatedHeaderRows.length + 1}` }
);

// 4. Apply styles to designated top header rows
const totalCols = 11; // Columns A (0) through K (10)

designatedHeaderRows.forEach((row, rowIndex) => {
    for (let colIndex = 0; colIndex < totalCols; colIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });

        if (!worksheet[cellAddress]) {
            worksheet[cellAddress] = { t: 's', v: '' };
        } else {
            worksheet[cellAddress].t = 's';
            worksheet[cellAddress].v = String(worksheet[cellAddress].v ?? '');
        }

        worksheet[cellAddress].s = {
            alignment: { horizontal: 'left', vertical: 'center' }
        };
    }
});

// -------------------------------------------------------------
// 5. AUTO-FIT COLUMN 1 (A) ONLY & LOCATE TABLE HEADER ROW
// -------------------------------------------------------------
worksheet['!cols'] = worksheet['!cols'] || [];

let maxColAWidth = 10;
let tableHeaderRowIndex = -1;

Object.keys(worksheet).forEach(cellKey => {
    if (cellKey.startsWith('!')) return;

    const { r, c } = XLSX.utils.decode_cell(cellKey);
    const cellVal = String(worksheet[cellKey]?.v ?? '').trim();

    // Auto-fit Column A
    if (c === 0) {
        if (cellVal.length > maxColAWidth) {
            maxColAWidth = cellVal.length;
        }

        // Broad matching: check if cell in Col A matches 'height' or 'pow (%)' exists in Col B
        if (cellVal.toLowerCase() === 'height' || cellVal.toLowerCase().includes('variable')) {
            tableHeaderRowIndex = r;
        }
    }
});

// Apply dynamic width to Column A
worksheet['!cols'][0] = { wch: maxColAWidth + 3 };

// -------------------------------------------------------------
// 6. APPLY RIGHT ALIGNMENT + FONT SIZE 8 TO HEADER ROW
// -------------------------------------------------------------

//Fallback: If dynamic lookup missed, default to row 34 (index 33)
// if (tableHeaderRowIndex === -1 && activeRange.e.r >= 33) {
    tableHeaderRowIndex = 33;
//}

const activeRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

if (tableHeaderRowIndex !== -1) {
    // 1. Initialize !rows and !cols arrays
    worksheet['!rows'] = worksheet['!rows'] || [];
    worksheet['!cols'] = worksheet['!cols'] || [];

    // 2. Set fixed height for row 34 in pixels (e.g., 30px)
    worksheet['!rows'][tableHeaderRowIndex] = { hpx: 20 };

    for (let c = 0; c <= activeRange.e.c; c++) {
        // 3. Set column widths: Auto-fit Col A (index 0), fixed pixels for all others
        if (c === 0) {
            worksheet['!cols'][0] = { wpx: 86.6}; // 86.6px
        } else {
            worksheet['!cols'][c] = { wpx: 60 }; // Fixed pixel width for Col B, C, D, etc.
        }

        const cellAddress = XLSX.utils.encode_cell({ r: tableHeaderRowIndex, c: c });

        if (!worksheet[cellAddress]) {
            worksheet[cellAddress] = { t: 's', v: '' };
        } else {
            worksheet[cellAddress].t = 's';
            worksheet[cellAddress].v = String(worksheet[cellAddress].v ?? '');
        }

        // Explicitly set alignment and font size
        worksheet[cellAddress].s = {
            alignment: {
                horizontal: 'right',
                vertical: 'center'
            },
            font: {
                sz: 8
            }
        };
    }
}

// -------------------------------------------------------------
// 7. SANITIZE VALUES & UPDATE BOUNDARIES (PRESERVES EXISTING STYLES)
// -------------------------------------------------------------
Object.keys(worksheet).forEach(key => {
    if (key.startsWith('!')) return;

    // Clean up NaN values without overriding the .s style property
    if (worksheet[key].v === 'NaN' || Number.isNaN(worksheet[key].v)) {
        worksheet[key].v = 0;
    }

    const { r, c } = XLSX.utils.decode_cell(key);
    if (r > activeRange.e.r) activeRange.e.r = r;
    if (c > activeRange.e.c) activeRange.e.c = c;
});

worksheet['!ref'] = XLSX.utils.encode_range(activeRange);

    // 4. Save Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Answers');

    const filename = `pangya_export_${info.label.replace(/[^A-Za-z]/g, '')}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, filename);
}