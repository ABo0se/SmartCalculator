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
    // Initial List
    distancelist = [];
    heightlist = [];
    windlist = [];
    slopelist = [];
    winddeglist = [];
    groundlist = [];
    spinlist = [];
    curvelist = [];
    
    // Answer List
    powerList = [];
    powerdeltalist = [];
    heightaveragedeltalist = [];
    heightdifflist = [];
    hwilist = [];
    hwiaimlist = [];
    windeffectdifflist = [];
    
    // Constants
    critical = [];
    modifier = [];
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


function GetAnswer()
{
    //MainCalcFunction
    let mydata = new DataInformation();
    let myanswer = new AnswerFinder();
    mydata.distancestart = document.getElementById("distance1").value;
    mydata.distanceend = document.getElementById("distance2").value;
    mydata.heightstart = document.getElementById("height1").value;
    mydata.heightend = document.getElementById("height2").value;
    mydata.windstart = document.getElementById("wind1").value;
    mydata.windend = document.getElementById("wind2").value;
    mydata.winddegstart = document.getElementById("degree1").value;
    mydata.winddegend = document.getElementById("degree2").value;
    mydata.slopestart = document.getElementById("slope1").value;
    mydata.slopeend = document.getElementById("slope2").value;
    mydata.groundstart = document.getElementById("ground1").value;
    mydata.groundend = document.getElementById("ground2").value;
    mydata.spinstart = document.getElementById("spin1").value;
    mydata.spinend = document.getElementById("spin2").value;
    mydata.curvestart = document.getElementById("curve1").value;
    mydata.curveend = document.getElementById("curve2").value;
    mydata.Aim = document.getElementById("aim").value;
    mydata.DiffRate = document.getElementById("datafrequency").value;
    mydata.HWIMultiplier = document.getElementById("dis").value;

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
    else if (document.getElementById("slopecheckbox").checked)
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

    //Set Var
    mydata.dataloopcount = 0;
    switch (mydata.datatype)
    {
        case 0:
            // Distance
            {
                for (i = 0; i < Math.Abs(Math.Floor((mydata.distanceend - mydata.distancestart)/(mydata.DiffRate))); i++)
                {
                    let newdistance = mydata.distancestart + (i * mydata.DiffRate);
                    myanswer.distancelist.push(newdistance);
                    mydata.dataloopcount++;
                }
                break;
            }

        case 1:
            // Height
            {
                for (i = 0; i < Math.Abs(Math.Floor((mydata.heightend - mydata.heightstart)/(mydata.DiffRate))); i++)
                {
                    let newheight = mydata.heightstart + (i * mydata.DiffRate);
                    myanswer.heightlist.push(newheight);
                    mydata.dataloopcount++;
                }
                break;
            }

        case 2:
            // Wind
            {
                for (i = 0; i < Math.Abs(Math.Floor((mydata.windend - mydata.windstart)/(mydata.DiffRate))); i++)
                {
                    let newwind = mydata.windstart + (i * mydata.DiffRate);
                    myanswer.windlist.push(newwind);
                    mydata.dataloopcount++;
                }
                break;
            }

        case 3:
            // Wind Degree
            {
                for (i = 0; i < Math.Abs(Math.Floor((mydata.winddegend - mydata.winddegstart)/(mydata.DiffRate))); i++)
                {
                    let newwinddeg = mydata.winddegstart + (i * mydata.DiffRate);
                    myanswer.winddeglist.push(newwinddeg);
                    mydata.dataloopcount++;
                }
                break;
            }

        case 4:
            // Slope
            {
                for (i = 0; i < Math.Abs(Math.Floor((mydata.slopeend - mydata.slopestart)/(mydata.DiffRate))); i++)
                {
                    let newslope = mydata.slopestart + (i * mydata.DiffRate);
                    myanswer.slopelist.push(newslope);
                    mydata.dataloopcount++;
                }
                break;
            }

        case 5:
            // Ground
            {
                for (i = 0; i < Math.Abs(Math.Floor((mydata.groundend - mydata.groundstart)/(mydata.DiffRate))); i++)
                {
                    let newground = mydata.groundstart + (i * mydata.DiffRate);
                    myanswer.groundlist.push(newground);
                    mydata.dataloopcount++;
                }
                break;
            }

        case 6:
            // Spin
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.spinend - mydata.spinstart)); i++)
                {
                    let newspin = mydata.spinstart + (i * mydata.DiffRate);
                    myanswer.spinlist.push(newspin);
                }
                break;
            }

        case 7:
            // Curve
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.curveend - mydata.curvestart)); i++)
                {
                    let newcurve = mydata.curvestart + (i * mydata.DiffRate);
                    myanswer.curvelist.push(newcurve);
                }
                break;
            }
        default:
            //Invalid
            break;
    }
}

// Calculation Functions
function calc(mydata, myanswer) {
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

    for (i = 0; i < mydata.dataloopcount; i++)
    {
        
    }
}

function checkValidInput(value) {
    if (value == null || value.trim() === '')
        return 0;

    const number = Number(value);

    return Number.isNaN(number) ? 0 : number;
}

// Class Function