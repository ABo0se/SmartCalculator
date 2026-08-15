class DataInformation
{
    // Data
    distancestart = 0;
    distanceend = 0;
    heightstart = 0;
    heightend = 0;
    windstart = 0;
    windend = 0;
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
    // 3 = Slope
    // 4 = Ground
    // 5 = Spin
    // 6 = Curve
    // -1 = not defined
    datatype = -1;

    // Default
    DiffRate = 1;
    Aim = 4;
}

class AnswerFinder{
    // Initial List
    distancelist = [];
    heightlist = [];
    windlist = [];
    slopelist = [];
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
    else if (document.getElementById("slopecheckbox").checked)
    {
        mydata.datatype = 3;
    }
    else if (document.getElementById("groundcheckbox").checked)
    {
        mydata.datatype = 4;
    }
    else if (document.getElementById("spincheckbox").checked)
    {
        mydata.datatype = 5;
    }
    else if (document.getElementById("curvecheckbox").checked)
    {
        mydata.datatype = 6;
    }

    switch (mydata.datatype)
    {
        case 0:
            // Distance
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.distanceend - mydata.distancestart)); i++)
                {
                    let newdistance = mydata.distancestart + (i * mydata.DiffRate);
                    myanswer.distancelist.push(newdistance);
                }
                for (const distance of myanswer.distancelist)
                {
                    
                }
                break;
            }

        case 1:
            // Height
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.heightend - mydata.heightstart)); i++)
                {
                    let newheight = mydata.heightstart + (i * mydata.DiffRate);
                    myanswer.heightlist.push(newheight);
                }
                for (const height of myanswer.heightlist)
                {
                    
                }
                break;
            }

        case 2:
            // Wind
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.windend - mydata.windstart)); i++)
                {
                    let newwind = mydata.windstart + (i * mydata.DiffRate);
                    myanswer.windlist.push(newwind);
                }
                for (const wind of myanswer.windlist)
                {
                    
                }
                break;
            }

        case 3:
            // Slope
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.slopeend - mydata.slopestart)); i++)
                {
                    let newslope = mydata.slopestart + (i * mydata.DiffRate);
                    myanswer.slopelist.push(newslope);
                }
                for (const slope of myanswer.slopelist)
                {
                    
                }
                break;
            }

        case 4:
            // Ground
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.groundend - mydata.groundstart)); i++)
                {
                    let newground = mydata.groundstart + (i * mydata.DiffRate);
                    myanswer.groundlist.push(newground);
                }
                for (const ground of myanswer.groundlist)
                {
                    
                }
                break;
            }

        case 5:
            // Spin
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.spinend - mydata.spinstart)); i++)
                {
                    let newspin = mydata.spinstart + (i * mydata.DiffRate);
                    myanswer.spinlist.push(newspin);
                }
                for (const spin of myanswer.spinlist)
                {
                    
                }
                break;
            }

        case 6:
            // Curve
            {
                for (i = 0; i < Math.Abs(Math.Floor(mydata.curveend - mydata.curvestart)); i++)
                {
                    let newcurve = mydata.curvestart + (i * mydata.DiffRate);
                    myanswer.curvelist.push(newcurve);
                }
                for (const curve of myanswer.curvelist)
                {
                    
                }
                break;
            }
        default:
            //Invalid
            break;
    }
}

// Calculation Functions
function calc(el) {

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

    let distance = checkValidInput(document.getElementById('distance').value);
    let height = checkValidInput(document.getElementById('height').value);
    let wind = checkValidInput(document.getElementById('wind').value);
    let degree = checkValidInput(document.getElementById('degree').value);
    let ground = checkValidInput(document.getElementById('ground').value)
    let spin = checkValidInput(document.getElementById('spin').value);
    let curve = checkValidInput(document.getElementById('curve').value);
    let slope_break = checkValidInputSlope(document.getElementById('slope_break').value);
    let dis = checkValidInput(document.getElementById('dis').value);
    let aim = checkValidInputSlope(document.getElementById('aim').value);

    // 100 % ground
    if (ground == 0.0)
        ground = 100.0;

    let result = document.getElementById('result');
    let result2 = document.getElementById('result');

    // Make options
    const input_values = {
        power_player: {
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
        },
        club_info: club,
        shot: shot,
        power_shot: power_shot,
        distance: distance,
        height: height,
        wind: wind,
        degree: degree,
        ground: ground,
        spin: spin,
        curva: curve,
        slope: slope_break
    };

    // Calc
    const found = find_power(   input_values.power_player,
                                input_values.club_info,
                                input_values.shot,
                                input_values.power_shot,
                                input_values.distance, 
                                input_values.height, 
                                input_values.wind, 
                                input_values.degree, 
                                input_values.ground, 
                                input_values.spin, 
                                input_values.curva,
                                input_values.slope);

    let f = [found];
    let index_f = 0;

    if (found.power != -1) {

        do {

            index_f++;

            f.push
            (
                find_power
                (   
                    input_values.power_player,
                    input_values.club_info,
                    input_values.shot,
                    input_values.power_shot,
                    input_values.distance, 
                    input_values.height, 
                    input_values.wind, 
                    input_values.degree, 
                    input_values.ground, 
                    input_values.spin, 
                    input_values.curva, 
                    input_values.slope,
                    Math.atan2(f[index_f - 1].desvio * 1.5, input_values.distance), 
                    f[index_f - 1].power
                )
            );

        } while (f[index_f].power != -1 && f[index_f -1].power != -1 && Math.abs(f[index_f - 1].desvio - f[index_f].desvio) >= 0.05);
    }

    if (f[index_f].power != -1) {

        result.color = 'Green';
        result.innerHTML = `
	<text style="color:Pink"><text style="font-size:16px">
		Power : ${(f[index_f].power * 100).toFixed(3)}%
	</text><br>
	<text style="color:Pink"><text style="font-size:16px">
		HWI : ${(desvioByDegree(f[index_f].desvio, distance) / 0.2167).toFixed(4)} pb
	</text><br>
	<text style="color:Pink"><text style="font-size:16px">
		AIM : ${(((desvioByDegree(f[index_f].desvio, distance) / 0.2167) * dis ) / aim ).toFixed(4)} aim
	</text><br>
    <text style="color:Pink"><text style="font-size:16px">
		Shot Power : ${(f[index_f].power_range * f[index_f].power).toFixed(3)}y
	</text><br><br>
	<text style="color:Pink"><text style="font-size:16px">
		Pre Calip = ${(Math.floor(f[index_f].power/(1/360))*(1/360)*f[index_f].power_range).toFixed(1)}y
	</text><br>
	<text style="color:Pink"><text style="font-size:16px">
		Next Calip = ${(Math.ceil(f[index_f].power/(1/360))*(1/360)*f[index_f].power_range).toFixed(1)}y
	</text><br>`;

    }else {
        result.color = 'Red'
        result.innerHTML = 'ไม่สามารถจำลองการตีได้ ลองตรวจสอบค่าที่ป้อน'
    }
}