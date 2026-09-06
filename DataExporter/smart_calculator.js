// Arquivo smart_calculator.js
// Criado em 31/08/2020 as 18:21 por Acrisio
// Algoritmo que calcula o lançamento obliquo com resistência do meio e o efeito magnus.
// Obtido atraves de engenharia reversa do pangya.

const DESVIO_SCALE_PANGYA_TO_YARD = 0.3125 / 1.5;

class Vector3D {

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    normalize() {
        return this.divideScalar( this.length() );
    }

    multiplyScalar(value) {

        this.x *= value;
        this.y *= value;
        this.z *= value;

        return this;
    }

    add(vector3d) {

        this.x += vector3d.x;
        this.y += vector3d.y;
        this.z += vector3d.z;

        return this;
    }

    add3D(x, y, z) {

        this.x += x;
        this.y += y;
        this.z += z;

        return this;
    }

    sub(vector3d) {

        this.x -= vector3d.x;
        this.y -= vector3d.y;
        this.z -= vector3d.z;

        return this;
    }

    sub3D(x, y, z) {

        this.x -= x;
        this.y -= y;
        this.z -= z;

        return this;
    }

    divideScalar(value) {

        if (value != 0) {

            let scalar = 1 / value;

            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;

        }else {

            this.x = 0.0;
            this.y = 0.0;
            this.z = 0.0;
        }

        return this;
    }

    cross(vector3d) {

        let x = this.x, y = this.y, z = this.z;

        this.x = y * vector3d.z - z * vector3d.y;
        this.y = z * vector3d.x - x * vector3d.z;
        this.z = x * vector3d.y - y * vector3d.x;

        return this;

      }

    length() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
    }

    clone() {
        return new Vector3D(this.x, this.y, this.z);
    }
}

const TYPE_DISTANCE = {
    LESS_10: 0,
    LESS_15: 1,
    LESS_28: 2,
    LESS_58: 3,
    BIGGER_OR_EQUAL_58: 4,
}

function calculeTypeDistance(distance) {

    let type = TYPE_DISTANCE.BIGGER_OR_EQUAL_58;

    if (distance >= 58.0)
        return TYPE_DISTANCE.BIGGER_OR_EQUAL_58;
    else if (distance < 10.0)
        return TYPE_DISTANCE.LESS_10;
    else if (distance < 15.0)
        return TYPE_DISTANCE.LESS_15;
    else if (distance < 28.0)
        return TYPE_DISTANCE.LESS_28;
    else if (distance < 58.0)
        return TYPE_DISTANCE.LESS_58; // Esse não precisa já que ele passou do primeiro if, mas deixar assim

    return type;
}

// JP Base ball Static Object
class Ball {

    position = new Vector3D(0.0, 0.0, 0.0);

    slope = new Vector3D(0.0, 1.0, 0.0);

    // Ball Flag state process
    state_process = 0;

    max_height = 0.0;
    num_max_height = -1;

    count = 0;

    // Velocity
    velocity = new Vector3D(0.0, 0.0, 0.0);

    ball_28 = 0.0;
    ball_2C = 0.0;
    ball_30 = 0.0;

    curva = 0.0;
    spin = 0.0;

    rotation_curve = 0.0;
    rotation_spin = 0.0;

    // Flags
    ball_44 = 0;
    ball_48 = 0;
    ball_70 = -1;
    ball_90 = 0;

    ball_BC = 0;

    mass = 0.045926999;
    diametro = 0.14698039;

    copy(other) {

        let cpy = this;

        cpy.position = other.position.clone();
        cpy.slope = other.slope.clone();
        cpy.velocity = other.velocity.clone();
        cpy.state_process = other.state_process;
        cpy.max_height = other.max_height;
        cpy.spin = other.spin;
        cpy.curva = other.curva;
        cpy.count = other.count;
        cpy.num_max_height = other.num_max_height;
        cpy.ball_28 = other.ball_28;
        cpy.ball_2C = other.ball_2C;
        cpy.ball_30 = other.ball_30;
        cpy.ball_3C = other.ball_3C;
        cpy.ball_40 = other.ball_40;
        cpy.ball_44 = other.ball_44;
        cpy.ball_48 = other.ball_48;
        cpy.ball_70 = other.ball_70;
        cpy.ball_90 = other.ball_90;
        cpy.ball_BC = other.ball_BC;
        cpy.ball_C4 = other.ball_C4;
        cpy.ball_C8 = other.ball_C8;
    }
}

const POWER_SHOT_FACTORY = {
    NO_POWER_SHOT: 0,
    ONE_POWER_SHOT: 1,
    TWO_POWER_SHOT: 2,
    ITEM_15_POWER_SHOT: 3
}

function getPowerShotFactory(ps) {

    let power_shot_factory = 0.0;

    switch (ps) {
        case POWER_SHOT_FACTORY.ONE_POWER_SHOT:
            power_shot_factory = 10.0;
            break;
        case POWER_SHOT_FACTORY.TWO_POWER_SHOT:
            power_shot_factory = 20.0;
            break;
        case POWER_SHOT_FACTORY.ITEM_15_POWER_SHOT:
            power_shot_factory = 15.0;
            break;
    }

    return power_shot_factory
}

const CLUB_TYPE = {
    WOOD: 0,
    IRON: 1,
    PW: 2,
    PT: 3
}

class ClubInfo {

    constructor(type, rotation_spin, rotation_curve, power_factor, degree, power_base) {

        this.type = type;
        this.rotation_spin = rotation_spin;
        this.rotation_curve = rotation_curve;
        this.power_factor = power_factor;
        this.degree = degree;
        this.power_base = power_base;
    }
}


const CLUB_INFO = {
    _1W: new ClubInfo(CLUB_TYPE.WOOD,  0.55, 1.61, 236.0, 10.0, 230.0),
    _2W: new ClubInfo(CLUB_TYPE.WOOD,  0.50, 1.41, 204.0, 13.0, 210.0),
    _3W: new ClubInfo(CLUB_TYPE.WOOD,  0.45, 1.26, 176.0, 16.0, 190.0),
    _2I: new ClubInfo(CLUB_TYPE.IRON,  0.45, 1.07, 161.0, 20.0, 180.0),
    _3I: new ClubInfo(CLUB_TYPE.IRON,  0.45, 0.95, 149.0, 24.0, 170.0),
    _4I: new ClubInfo(CLUB_TYPE.IRON,  0.45, 0.83, 139.0, 28.0, 160.0),
    _5I: new ClubInfo(CLUB_TYPE.IRON,  0.45, 0.73, 131.0, 32.0, 150.0),
    _6I: new ClubInfo(CLUB_TYPE.IRON,  0.41, 0.67, 124.0, 36.0, 140.0),
    _7I: new ClubInfo(CLUB_TYPE.IRON,  0.36, 0.61, 118.0, 40.0, 130.0),
    _8I: new ClubInfo(CLUB_TYPE.IRON,  0.30, 0.57, 114.0, 44.0, 120.0),
    _9I: new ClubInfo(CLUB_TYPE.IRON,  0.25, 0.53, 110.0, 48.0, 110.0),
    PW: new ClubInfo(CLUB_TYPE.PW,     0.18, 0.49, 107.0, 52.0, 100.0),
    SW: new ClubInfo(CLUB_TYPE.PW,     0.17, 0.42, 93.0, 56.0, 80.0),
    PT1: new ClubInfo(CLUB_TYPE.PT,    0.00, 0.00, 30.0, 0.00, 20.0),
    PT2: new ClubInfo(CLUB_TYPE.PT,    0.00, 0.00, 21.0, 0.00, 10.0)
}

const CLUB_INFO_ENUM = [
    '_1W',
    '_2W',
    '_3W',
    '_2I',
    '_3I',
    '_4I',
    '_5I',
    '_6I',
    '_7I',
    '_8I',
    '_9I',
    'PW',
    'SW',
    'PT1',
    'PT2'
]

const POWER_SHOT_FACTORY_ENUM = [
    'NO_POWER_SHOT',
    'ONE_POWER_SHOT',
    'TWO_POWER_SHOT',
    'ITEM_15_POWER_SHOT'
]

const SHOT_TYPE_ENUM = [
    'DUNK',
    'TOMAHAWK',
    'SPIKE',
    'COBRA'
]

class Club {

    type = CLUB_TYPE.WOOD; // 1W

    type_distance = TYPE_DISTANCE.BIGGER_OR_EQUAL_58;

    // 1W
    rotation_spin =     0.55;      // Rotação spin
    rotation_curve =    1.61;       // Rotação curva
    power_factor =      236;       // Power shot
    degree =            10;        // Angulo
    power_base =        230;       // Base power

    init(club_info) {

        this.type = club_info.type;

        this.rotation_spin  = club_info.rotation_spin;
        this.rotation_curve = club_info.rotation_curve;
        this.power_factor   = club_info.power_factor;
        this.degree         = club_info.degree;
        this.power_base     = club_info.power_base;
    }

    getDregRad() {
        return this.degree * Math.PI / 180;
    }

    getPower(extraPower, pwrSlot, ps, spin) {

        // Get Auxpart
        // Get Card
        // Get Mascot
        let pwrjard = 0.0;

        switch(this.type) {
            case CLUB_TYPE.WOOD: {

                pwrjard = extraPower.total(ps) + getPowerShotFactory(ps) + ((pwrSlot - 15) * 2);

                pwrjard *= 1.5;
                pwrjard /= this.power_base;
                pwrjard += 1;
                pwrjard *= this.power_factor;

                break;
            }
            case CLUB_TYPE.IRON: {

                pwrjard = ((getPowerShotFactory(ps) / this.power_base + 1.0) * this.power_factor) +
                (extraPower.total(ps) * this.power_factor * 1.3) / this.power_base;

                break;
            }
            case CLUB_TYPE.PW: { // SW e PW

                const getPowerByDegree = (degree, spin) => {
                    return 0.5 + ((0.5 * (degree + (spin * _00D19B98))) / (56/*Ang*/ / 180 * Math.PI));
                }

                switch (this.type_distance) {
                    case TYPE_DISTANCE.LESS_10:
                    case TYPE_DISTANCE.LESS_15:
                    case TYPE_DISTANCE.LESS_28:
                        pwrjard = (getPowerByDegree(this.getDregRad(), spin) * (52.0 + (ps ? 28.0 : 0))) +
                        (extraPower.total(ps) * this.power_factor) / this.power_base;
                        break;
                    case TYPE_DISTANCE.LESS_58:
                        pwrjard = (getPowerByDegree(this.getDregRad(), spin) * (80.0 + (ps ? 18.0 : 0))) +
                        (extraPower.total(ps) * this.power_factor) / this.power_base;
                        break;
                    case TYPE_DISTANCE.BIGGER_OR_EQUAL_58:
                        pwrjard = ((getPowerShotFactory(ps) / this.power_base + 1.0) * this.power_factor) +
                        (extraPower.total(ps) * this.power_factor) / this.power_base;
                        break;
                }

                break;
            }
            case CLUB_TYPE.PT: {
                pwrjard = this.power_factor;
                break;
            }
        }

        return pwrjard;
    }

    // Rotation
    getPower2(extraPower, pwrSlot, ps) {


        let pwrjard = (extraPower.auxpart + extraPower.mascot + extraPower.card) / 2 + (pwrSlot - 15);

        if (ps)
            pwrjard += (extraPower.ps_card / 2);

        pwrjard /= 170;

        return pwrjard + 1.5;
    }

    getRange(extraPower, pwrSlot, ps) {

        let pwr_range = this.power_base + extraPower.total(ps) + getPowerShotFactory(ps);

        if (this.type == CLUB_TYPE.WOOD)
            pwr_range += ((pwrSlot - 15) * 2)

        if (this.type == CLUB_TYPE.PW) {

            switch (this.type_distance) {
                case TYPE_DISTANCE.LESS_10:
                case TYPE_DISTANCE.LESS_15:
                case TYPE_DISTANCE.LESS_28:
                    pwr_range = 30.0 + (ps ? 30.0 : 0.0) + extraPower.total(ps)
                    break;
                case TYPE_DISTANCE.LESS_58:
                    pwr_range = 60.0 + (ps ? 20.0 : 0.0) + extraPower.total(ps)
                    break;
                case TYPE_DISTANCE.BIGGER_OR_EQUAL_58:
                    pwr_range = this.power_base + extraPower.total(ps) + getPowerShotFactory(ps);
                    break;
            }
        }

        return pwr_range;
    }
}

class Wind {

    wind = 0;
    degree = 0;

    getWind() {
        return new Vector3D(this.wind * Math.sin(this.degree * Math.PI / 180) * -1, 0, this.wind * Math.cos(this.degree * Math.PI / 180));
    }
}

// const Object ball
const ball = new Ball();

// const club
const club = new Club();

// const wind
const wind = new Wind();

// Const values
const _00D3D008 = 0.00001; // compare with 0 acho
const _00D046A8 = -1.0; // -1 value constant
const _00D00190 = 0.75; // const
const _00D083A0 = 0.02; // Step time, pangya 0.02
const _00D66CF8 = 3.0;  // Valor 3 que não sei bem o que é
const _00D3D028 = 0.00008; // Efeito Mangnus acho
const _00D1A888 = 12.566371;  // Não sei
const _00D3D210 = 25.132742; // Não sei
const _00CFF040 = 0.1;
const _00D66CA0 = 0.5;
const _00D16928 = 0.002;
const _00D17908 = 0.349065847694874;
const _00D19B98 = 0.0698131695389748;
const _00D16758 = 0.01

const slope_break_to_curve_slope = 0.00875;

const _00E42544_vect_slope = new Vector3D(0.0, 0.0, 1.0);

class QuadTree {

    constructor() {
        this.ball = new Ball();
        this.club = new Club();
        this.wind = new Wind();
    }

    gravityFactor = 1;
    gravity = 34.295295715332; // gravity in Yards(scale pangya)

    _21D8_vect = new Vector3D(0.0, 0.0, 0.0);

    getGravity() {
        return this.gravity * this.gravityFactor;
    }

    // Usa no cobra
    ball_position_init = new Vector3D(0.0, 0.0, 0.0);
    power_range_shot = 0.0;

    shot = SHOT_TYPE.DUNK;
    power_factor_shot = 0.0;
    percentShot_sqrt = 0.0;
    spike_init = -1;
    spike_med = -1;
    power_factor = 0.0;
    cobra_init = -1;

    // Init Shot
    initShot(ball, club, wind, options) {

        this.ball = ball;
        this.club = club;
        this.wind = wind;

        this.shot = options.shot;
        this.spike_init = -1;
        this.spike_med = -1;
        this.cobra_init = -1;

        this.ball.position = options.position.clone();

        // Usa no Cobra
        this.ball_position_init = options.position.clone();

        // Type distance
        this.club.type_distance = calculeTypeDistance(options.distance);

        // init max_height (tracked from the ball's lower bound, not its center)
        this.ball.max_height = this.ball.position.y - (this.ball.diametro / 2);

        this.ball.count = 0;
        this.ball.num_max_height = -1;

        let pwr = this.club.getPower(options.power.options, options.power.pwr, options.ps, options.spin);

        // Guarda para usa no cobra
        this.power_range_shot = this.club.getRange(options.power.options, options.power.pwr, options.ps);

        // Guarda para usar no spike
        this.power_factor = pwr;

        pwr *= Math.sqrt(options.percentShot);

        // Multiplica por 1.0 ou 1.3
        if (options.shot == SHOT_TYPE.TOMAHAWK || options.shot == SHOT_TYPE.SPIKE/*Toma e spike */)
            pwr *= 1.3;
        else
            pwr *= 1.0;

        // Percent Erro de pangya e ground
        pwr *= Math.sqrt(options.ground * 0.01);

        // Guarda para usar no spike
        this.power_factor_shot = pwr;
        this.percentShot_sqrt = Math.sqrt(options.percentShot);

        this.ball.curva = options.curva;
        this.ball.spin = options.spin;

        let value1 = this.getValuesDegree(options.mira_rad + (0 - (this.ball.curva * _00D17908)), 1);
        let value2 = this.getValuesDegree((this.club.type_distance == TYPE_DISTANCE.BIGGER_OR_EQUAL_58 ? this.club.getDregRad() : this.club.getDregRad() + (this.ball.spin * _00D19B98)), 0);

        this.ball.curva -= this.getSlope(options.mira_rad - options.slope_mira_rad, Math.random()/* Rotation Ball Line */);

        pwr *= ((Math.abs(this.ball.curva) * 0.1) + 1);

        // tava cos2, neg_rad, neg_sin
        let vectA = new Vector3D(value2.neg_sin, value2.neg_rad, value2.cos2);

        vectA.multiplyScalar(pwr);

        let v1 = new Vector3D(value1.cos, value1.rad, value1.sin);
        let v2 = new Vector3D(value1._C, value1._10, value1._14);
        let v3 = new Vector3D(value1.neg_sin, value1.neg_rad, value1.cos2);
        let v4 = new Vector3D(value1._24, value1._28, value1._2C);

        this.ball.velocity.x = v2.x * vectA.y + vectA.x * v1.x + v3.x * vectA.z + v4.x;
        this.ball.velocity.y = v1.y * vectA.x + v2.y * vectA.y + v3.y * vectA.z + v4.y;
        this.ball.velocity.z = v1.z * vectA.x + v2.z * vectA.y + v3.z * vectA.z + v4.z;

        // Rotação eixo X, Z
        this.ball.rotation_curve = this.ball.curva * options.percentShot;
        this.ball.rotation_spin = this.club.type_distance == TYPE_DISTANCE.BIGGER_OR_EQUAL_58
            ? (this.club.getPower2(options.power.options, options.power.pwr, options.ps) * options.percentShot) * options.percentShot
            : 0.0;

        this.ball.ball_48 = this.ball.ball_44; // Flag Power Shot
    }

    getSlope(mira, line_ball) {

        // values Degree To Matrix
        const valuesDegreeToMatrix = (value) => {

            return {
                v1: new Vector3D(value.cos, value.rad, value.sin),
                v2: new Vector3D(value._C, value._10, value._14),
                v3: new Vector3D(value.neg_sin, value.neg_rad, value.cos2),
                v4: new Vector3D(value._24, value._28, value._2C)
            }
        }

        // Matrix cross Matrix
        const applyMatrix = (m1, m2) => {

            return {
                v1: new Vector3D(
                    m1.v1.x * m2.v1.x + m1.v1.y * m2.v2.x + m1.v1.z * m2.v3.x,
                    m1.v1.x * m2.v1.y + m1.v1.y * m2.v2.y + m1.v1.z * m2.v3.y,
                    m1.v1.x * m2.v1.z + m1.v1.y * m2.v2.z + m1.v1.z * m2.v3.z
                ),
                v2: new Vector3D(
                    m1.v2.x * m2.v1.x + m1.v2.y * m2.v2.x + m1.v2.z * m2.v3.x,
                    m1.v2.x * m2.v1.y + m1.v2.y * m2.v2.y + m1.v2.z * m2.v3.y,
                    m1.v2.x * m2.v1.z + m1.v2.y * m2.v2.z + m1.v2.z * m2.v3.z
                ),
                v3: new Vector3D(
                    m1.v3.x * m2.v1.x + m1.v3.y * m2.v2.x + m1.v3.z * m2.v3.x,
                    m1.v3.x * m2.v1.y + m1.v3.y * m2.v2.y + m1.v3.z * m2.v3.y,
                    m1.v3.x * m2.v1.z + m1.v3.y * m2.v2.z + m1.v3.z * m2.v3.z
                ),
                v4: new Vector3D(
                    m1.v4.x * m2.v1.x + m1.v4.y * m2.v2.x + m1.v4.z * m2.v3.x + m2.v4.x,
                    m1.v4.x * m2.v1.y + m1.v4.y * m2.v2.y + m1.v4.z * m2.v3.y + m2.v4.y,
                    m1.v4.x * m2.v1.z + m1.v4.y * m2.v2.z + m1.v4.z * m2.v3.z + m2.v4.z
                )
            };
        };

        // Calc slope
        let ball_slope_cross_const_vect = this.ball.slope.clone().cross(_00E42544_vect_slope);

        let slope_matrix = {
            v1: ball_slope_cross_const_vect.clone().normalize(),
            v2: this.ball.slope.clone(),
            v3: ball_slope_cross_const_vect.clone().cross(this.ball.slope).normalize(),
            v4: new Vector3D(0.0, 0.0, 0.0)
        };

        let value1 = this.getValuesDegree(mira * -1, 1);
        let value2 = this.getValuesDegree(line_ball * -2.0, 1);

        let m1 = applyMatrix(valuesDegreeToMatrix(value2), slope_matrix);

        let m2 = applyMatrix(m1, valuesDegreeToMatrix(value1));

        return m2.v2.x * _00D66CA0;
    }

    getValuesDegree(degree, option = 0) {

        let obj = new Object();

        if (option == 0) {

            obj.cos = 1.0;
            obj.rad = 0.0; // degree
            obj.sin = 0.0;
            obj._C = 0.0;
            obj._10 = Math.cos(degree);
            obj._14 = Math.sin(degree) * -1;
            obj.neg_sin = 0.0;
            obj.neg_rad = Math.sin(degree);
            obj.cos2 = obj._10;
            obj._24 = 0.0;
            obj._28 = 0.0;
            obj._2C = 0.0;

        }else if (option == 1) {

            obj.cos = Math.cos(degree);
            obj.rad = 0.0; // degree
            obj.sin = Math.sin(degree);
            obj._C = 0.0;
            obj._10 = 1.0;
            obj._14 = 0.0;
            obj.neg_sin = obj.sin * -1;
            obj.neg_rad = 0.0;
            obj.cos2 = obj.cos;
            obj._24 = 0.0;
            obj._28 = 0.0;
            obj._2C = 0.0;
        }

        return obj;
    }

    ballProcess(steptime, final = undefined) {

        this.bounceProcess(steptime, final);

        // Cobra
        if (this.shot == SHOT_TYPE.COBRA && this.cobra_init < 0) {

            if (this.percentShot_sqrt < Math.sqrt(0.8))
                this.percentShot_sqrt = Math.sqrt(0.8); // 80%

            if (this.ball.count == 0) {

                this.ball.velocity.y = 0.0;

                this.ball.velocity.normalize().multiplyScalar(this.power_factor_shot);
            }

            let diff = this.ball.position.clone().sub(this.ball_position_init).length();
            let cobra_init_up = ((this.power_range_shot * this.percentShot_sqrt) - 100.0) * 3.2;

            if (diff >= cobra_init_up) {

                // 1W, 2W e 3W
                let power_multiply = 0.0;

                if (this.club.type == CLUB_TYPE.WOOD) {

                    switch (this.club.power_base) {
                        case 230.0:
                            power_multiply = 74.0;
                            break;
                        case 210.0:
                            power_multiply = 76.0;
                            break;
                        case 190.0:
                            power_multiply = 80.0;
                            break;
                    }
                }

                this.cobra_init = this.ball.count;

                this.ball.velocity.normalize().multiplyScalar(power_multiply).multiplyScalar(this.percentShot_sqrt);

                this.ball.rotation_spin = 2.5;
            }

        }else {

            if (this.spike_init < 0 && this.cobra_init < 0 && this.club.type_distance == TYPE_DISTANCE.BIGGER_OR_EQUAL_58) {

                this.ball.rotation_spin -= ((_00D66CA0 - (this.ball.spin * _00CFF040)) * _00D083A0);

            }else if ((this.shot == SHOT_TYPE.SPIKE && this.spike_init >= 0) || (this.shot == SHOT_TYPE.COBRA && this.cobra_init >= 0))
                this.ball.rotation_spin -= _00D083A0;

            if (this.shot == SHOT_TYPE.SPIKE && this.ball.count == 0) {

                this.ball.velocity.y = 0.0;
                this.ball.velocity.normalize().multiplyScalar(this.power_factor_shot);

                // check se a bola andou já
                this.ball.velocity.normalize().multiplyScalar(72.5).multiplyScalar(this.percentShot_sqrt * 2);

                this.ball.rotation_spin = 3.1;

                this.spike_init = this.ball.count;

            }

            if (this.shot == SHOT_TYPE.SPIKE && this.ball.num_max_height >= 0 && (this.ball.num_max_height + 0x3C) < this.ball.count && this.spike_med < 0) {

                this.spike_med = this.ball.count;

                if (this.club.type == CLUB_TYPE.WOOD) {

                    let new_power = 0.0;

                    switch (this.club.power_base) {
                        case 230.0:

                            new_power = 344.0;

                            if ((this.power_factor * this.percentShot_sqrt) < 344.0)
                                new_power -= (this.power_factor * this.percentShot_sqrt);
                            else
                                new_power = 0.0;

                            new_power = new_power / 112.0 * 21.5;

                            new_power = -8 - new_power;

                            this.ball.velocity.y = new_power;

                            break;
                        case 210.0:

                            new_power = 306.0;

                            if ((this.power_factor * this.percentShot_sqrt) < 306.0)
                                new_power -= (this.power_factor * this.percentShot_sqrt);
                            else
                                new_power = 0.0;

                            new_power = new_power / 105.0 * 20.5;

                            new_power = -10.3 - new_power;

                            this.ball.velocity.y = new_power;

                            break;
                        case 190.0:

                            new_power = 273.0;

                            if ((this.power_factor * this.percentShot_sqrt) < 273.0)
                                new_power -= (this.power_factor * this.percentShot_sqrt);
                            else
                                new_power = 0.0;

                            new_power = new_power / 100 * 20.2;

                            new_power = -10.8 - new_power;

                            this.ball.velocity.y = new_power;

                            break;
                    }
                }

                this.ball.velocity.multiplyScalar(this.percentShot_sqrt * 7);

                this.ball.rotation_spin = this.ball.spin;
            }
        }

        if (this.ball.velocity.y < 0 && this.ball.num_max_height < 0) {

            this.ball.max_height = this.ball.position.y - (this.ball.diametro / 2);
            this.ball.num_max_height = this.ball.count;
        }

        this.ball.count++;
    }

    bounceProcess(steptime, final = undefined) {

        if (this.shot == SHOT_TYPE.SPIKE && this.ball.num_max_height >= 0 && (this.ball.num_max_height + 0x3C) > this.ball.count)
            return;

        let accellVect = this.applyForce();

        let otherVect = accellVect.clone();

        otherVect.divideScalar(this.ball.mass).multiplyScalar(steptime);

        this.ball.velocity.add(otherVect);

        if (this.ball.num_max_height == -1) {

            let tmpVect = this._21D8_vect.clone().divideScalar(this.ball.mass).multiplyScalar(steptime);

            this.ball.velocity.add(tmpVect);
        }

        this.ball.ball_2C += (this.ball.rotation_curve * _00D1A888 * steptime);

        this.ball.ball_30 += (this.ball.rotation_spin * _00D3D210 * steptime);

        this.ball.position.add(this.ball.velocity.clone().multiplyScalar((final !== undefined ? final : steptime)));

    }

    applyForce() {

        let retVect = new Vector3D(0.0, 0.0, 0.0);

        if (this.ball.rotation_curve != 0) {

            let vectorb = new Vector3D(this.ball.velocity.z * _00D046A8, 0, this.ball.velocity.x);

            vectorb.normalize();

            if (this.cobra_init < 0 || this.spike_init < 0)
                vectorb.multiplyScalar(_00D00190 * this.ball.rotation_curve * this.club.rotation_curve);

            retVect.add(vectorb);
        }

        if (this.shot == SHOT_TYPE.SPIKE && this.spike_init < 0)
            return new Vector3D(0.0, 0.0, 0.0);
        else if (this.shot == SHOT_TYPE.COBRA && this.cobra_init < 0)
            return retVect;

        let windVect = this.wind.getWind();

        windVect.multiplyScalar((this.shot == SHOT_TYPE.SPIKE ? _00D16758 : _00D083A0));

        retVect.add(windVect);

        retVect.y = retVect.y - (this.getGravity() * this.ball.mass);

        if (this.ball.rotation_spin != 0)
            retVect.y = retVect.y + (this.club.rotation_spin * _00D66CF8 * this.ball.rotation_spin);

        let velVect = this.ball.velocity.clone();

        velVect.multiplyScalar(velVect.length() * _00D3D028);

        retVect.sub(velVect);

        // return
        return retVect;
    }
}

const find_power = (power_player, club_info, shot, power_shot, distancia, altura, vento, angulo, terreno, spin, curva, slope, mira = undefined, percent = undefined) => {

    const altura_colision = altura * 1.094 * 3.2;
    const distanciaScale = distancia * 3.2;
    const vball = new Ball();
    const vclub = club;

    // The engine tracks the ball's center (position.y), but a shot should be considered
    // to have reached the target's elevation once the ball's *lower edge* touches it, not
    // its center. Offsetting the threshold upward by the ball's radius makes the center-based
    // crossing check equivalent to a lower-bound (bottom of hitbox) crossing check.
    const ball_radius = vball.diametro / 2;
    const altura_colision_center = altura_colision + ball_radius;

    // init Club Info
    if (club != undefined)
        vclub.init(club_info);

    // Calcule type distance
    vclub.type_distance = calculeTypeDistance(distancia);

    let slope_mira_rad = 0.0;

    if (slope instanceof Vector3D) {

        slope_mira_rad = slope.y;
        vball.slope = slope.clone();

        vball.slope.y = 1.0;

    }else if (!isNaN(slope))
        vball.slope = new Vector3D(slope * slope_break_to_curve_slope * -1, 1.0, 0.0);

    const margin = 0.00001;
    const limit_checking = 100000;
    let count = 0;
    let isFind = false;
    let found = {
        power: -1,
        desvio: 0.0
    }

    wind.wind = vento;
    wind.degree = angulo;

    const options = {
        distance: distancia,
        percentShot: percent || 1.0,
        ground: terreno,
        mira_rad: mira || 0.0,
        slope_mira_rad: slope_mira_rad,
        spin: spin/30,
        curva: curva/30,
        position: new Vector3D(0.0, 0.0, 0.0),
        shot: shot,
        ps: power_shot,
        power: power_player || {
            pwr: 31,
            options: {
                auxpart: 0,
                mascot: 4,
                card: 4,
                ps_auxpart: 0,
                ps_mascot: 0,
                ps_card: 8,
                total: function(option) {

                    let pwr = this.auxpart + this.mascot + this.card;

                    if (option == 1 || option == 2 || option == 3)
                        pwr += this.ps_auxpart + this.ps_mascot + this.ps_card;

                    return pwr;
                }
            }
        }
    }

    const powerRange = vclub.getRange(options.power.options, options.power.pwr, options.ps);

    const findAlturaColision = (qt, altura_colision) => {

        let count = 0;

        let copy_ball = new Ball();

        do {

            copy_ball.copy(vball);

            qt.ballProcess(_00D083A0);

        }while((vball.position.y > altura_colision || vball.num_max_height == -1) && (count++) < limit_checking)

        // If the ball never actually got above altura_colision, this shot definitively
        // does not have enough power to clear the target's elevation -- that's a real,
        // reliably-signed undershoot, no interpolation needed (and none is safe: both
        // samples are on the same side of the threshold).
        if (copy_ball.position.y <= altura_colision)
            return distanciaScale; // treat as a large, correctly-signed undershoot

        const heightDelta = vball.position.y - copy_ball.position.y;

        // Genuine crossing (copy_ball above, vball below) but the two samples are almost
        // the same height -- the ball is essentially grazing the threshold. Interpolating
        // here divides by a near-zero number and explodes; since we're already right at
        // the crossing, treat it as "close enough" instead.
        if (Math.abs(heightDelta) < 1e-6)
            return 0;

        let last_step = Math.abs((altura_colision - copy_ball.position.y) / heightDelta);

        vball.copy(copy_ball);

        qt.ballProcess(_00D083A0, _00D083A0 * last_step);

        if (Math.abs(distanciaScale - vball.position.z) <= margin)
            return 0;

        return distanciaScale - vball.position.z;
    }

    const qt = new QuadTree();

    let ret = 0;
    let lowBound = null, highBound = null; // percentShot known to undershoot / overshoot
    const bracketStep = 0.1;

    do {

        // 130% é um limite seguro, para ter a % da tacada mesmo que não chega, só para saber se estava perto e usar no macro de silvia cannon
        if (options.percentShot > 1.3)
            options.percentShot = 1.3;
        else if (options.percentShot < 0.0)
            options.percentShot = 0.1;

        qt.initShot(vball, vclub, wind, options);

        ret = findAlturaColision(qt, altura_colision_center);

        if (ret == 0) {
            isFind = true;
            break;
        }

        // Não tem como achar a força por que nem mandando 100% chega
        if (options.percentShot == 1.3 && ret > 0)
            break;

        // Não tem como achar a força por que não pode mandar 0.0 de porcentagem
        if (options.percentShot == 0.1 && ret < 0)
            break;

        if (ret > 0) {
            if (lowBound === null || options.percentShot > lowBound)
                lowBound = options.percentShot;
        } else {
            if (highBound === null || options.percentShot < highBound)
                highBound = options.percentShot;
        }

        if (lowBound !== null && highBound !== null) {
            // Bracketed: true bisection halves the interval every time and can never
            // underflow to a stuck step size the way the old feed-based search could.
            if (highBound - lowBound < 1e-12)
                break; // reached floating-point resolution floor between the two bounds
            options.percentShot = (lowBound + highBound) / 2;
        } else if (highBound !== null) {
            options.percentShot = highBound - bracketStep;
        } else if (lowBound !== null) {
            options.percentShot = lowBound + bracketStep;
        } else {
            options.percentShot += ret > 0 ? bracketStep : -bracketStep;
        }

    } while (!isFind && (count++) < limit_checking); //} while (!isFind);

    if (isFind) {

        found.power = options.percentShot;
        found.desvio = (vball.position.x + (options.position.x + (Math.tan(options.mira_rad) * distanciaScale))) * DESVIO_SCALE_PANGYA_TO_YARD
        found.power_range = powerRange;
        found.smartData = { desvio: found.desvio, altura: altura_colision, club: vclub, options: options };

    }

    return found;
}

const SHOT_TYPE = {
    DUNK: 0,
    TOMAHAWK: 1,
    SPIKE: 2,
    COBRA: 3,
}


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

function desvioByDegree(yards, distance) {
    return Math.sin(Math.atan2(yards * -1.5, distance)) * distance / 1.5;
}
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
function solveShot(power_player, club_info, shot, power_shot, distance, height, wind, degree, ground, spin, curve, slope_break) {

    const found = find_power(power_player, club_info, shot, power_shot, distance, height, wind, degree, ground, spin, curve, slope_break);

    let f = [found];
    let index_f = 0;
    let finalAim = 0; // find_power's own default when no mira/aim is passed in

    if (found.power == -1)
        return { ok: false };

    // G(aim) = atan2(desvio(aim)*1.5, distance) - aim is zero exactly at that fixed
    // point. Scan outward from aim=0 for a sign change in G (skipping isolated gaps
    // where find_power itself fails to converge for unrelated reasons -- this can
    // happen at individual aim values even when both neighbors succeed), then bisect.
    const AIM_SCAN_STEP = 0.01 * Math.PI;
    const AIM_SCAN_MAX_STEPS = 100;
    const AIM_BISECT_MAX_ITER = 100;
    const AIM_CONVERGE_THRESHOLD = 0.00001;

    const tryAim = (aim, warmPower) => find_power(
        power_player, club_info, shot, power_shot, distance, height, wind, degree, ground, spin, curve, slope_break,
        aim, warmPower
    );

    const fixedPointGap = (r, aim) => Math.atan2(r.desvio * 1.5, distance) - aim;

    const pushAttempt = (r) => { f.push(r); };
    const baseGap = fixedPointGap(f[0], 0);

    if (Math.abs(baseGap) < AIM_CONVERGE_THRESHOLD) {
        index_f = f.length - 1;
    } else {
        let bracketLoAim = null, bracketLoGap = null, bracketHiAim = null;

        scanLoop:
            for (const dir of [1, -1]) {
                let prevAim = 0, prevGap = baseGap, prevPower = f[0].power;
                for (let step = 1; step <= AIM_SCAN_MAX_STEPS; step++) {
                    const aim = dir * AIM_SCAN_STEP * step;
                    const r = tryAim(aim, prevPower);
                    pushAttempt(r);

                    if (r.power == -1)
                        continue;

                    const gap = fixedPointGap(r, aim);
                    if (Math.sign(gap) !== Math.sign(prevGap) && gap !== prevGap) {
                        bracketLoAim = prevAim;
                        bracketLoGap = prevGap;
                        bracketHiAim = aim;
                        break scanLoop;
                    }
                    prevAim = aim;
                    prevGap = gap;
                    prevPower = r.power;
                }
            }

        if (bracketLoAim !== null) {
            let loAim = bracketLoAim, loGap = bracketLoGap;
            let hiAim = bracketHiAim;
            let warmPower = f[f.length - 1].power;

            for (let i = 0; i < AIM_BISECT_MAX_ITER; i++) {
                let midAim = (loAim + hiAim) / 2;
                let r = tryAim(midAim, warmPower);
                pushAttempt(r);
                if (r.power == -1) {
                    const intervalLo = Math.min(loAim, hiAim);
                    const intervalHi = Math.max(loAim, hiAim);
                    const width = intervalHi - intervalLo;
                    let rescued = false;
                    const RESCUE_STEPS = 100;

                    for (let j = 1; j < RESCUE_STEPS; j++) {
                        const probeAim = intervalLo + (j / RESCUE_STEPS) * width;
                        if (Math.abs(probeAim - midAim) < 1e-12)
                            continue;
                        const pr = tryAim(probeAim, warmPower);
                        pushAttempt(pr);
                        if (pr.power != -1) {
                            midAim = probeAim;
                            r = pr;
                            rescued = true;
                            break;
                        }
                    }
                    if (!rescued) {
                        f[index_f].power = -1;
                        break;
                    }
                }
                warmPower = r.power;
                index_f = f.length - 1;
                finalAim = midAim;
                const gap = fixedPointGap(r, midAim);

                if (Math.abs(gap) < AIM_CONVERGE_THRESHOLD)
                    break;
                if (Math.sign(gap) === Math.sign(loGap)) {
                    loAim = midAim;
                    loGap = gap;
                } else {
                    hiAim = midAim;
                }
            }
        } else {
            f[index_f].power = -1;
        }
    }

    if (f[index_f].power == -1)
        return { ok: false };

    return { ok: true, power: f[index_f].power, power_range: f[index_f].power_range, desvio: f[index_f].desvio, aim: finalAim };
}

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

// Wind Pow Diff: how much Pow(y) changes per 1m/s of wind.
function computeWindEffDiff(power_player, club, shot, power_shot, params) {
    const EPS = 0.1; // m/s

    const evalAt = (signedOffset) => {
        const w = params.wind + signedOffset;
        const windMag = w >= 0 ? w : -w;
        const deg = w >= 0 ? params.degree : (((params.degree + 180) % 360) + 360) % 360;
        const r = solveShot(power_player, club, shot, power_shot,
            params.distance, params.height, windMag, deg, params.ground, params.spin, params.curve, params.slope);
        if (!r.ok)
            return null;
        const powY = r.power_range * r.power;
        // const powY = r.power;
        // Guard against the near-perpendicular case: when wind is close to pure crosswind
        // (degree near 90/270 relative to aim), cos(degree-aim) approaches 0, and even tiny,
        // genuine aim differences get massively amplified by dividing by it. Below this
        // threshold, treat the normalization as unreliable rather than returning a wild number.
        // const cosComponent = Math.cos((deg * Math.PI / 180) - r.aim);
        // if (Math.abs(cosComponent) < MIN_EFFECTIVE_TRIG)
        //     return null;
        // return powY / (Math.abs(cosComponent));
        return powY;
    };

    const normMinus = evalAt(-EPS);
    const normPlus = evalAt(EPS);
    if (normMinus === null || normPlus === null)
        return null;

    return Math.abs((normPlus - normMinus) / (2 * EPS));
}

// Height Pow Diff: how much Pow(y) changes per 1m of height.
function computeHeightPowDiff(power_player, club, shot, power_shot, params, fixedAim) {
    const EPS = 0.1; // m

    const evalAt = (height) => {
        const r = find_power(power_player, club, shot, power_shot,
            params.distance, height, params.wind, params.degree, params.ground, params.spin, params.curve, params.slope, fixedAim);
        return r.power !== -1 ? r.power_range * r.power : null;
    };

    const powMinus = evalAt(params.height - EPS);
    const powPlus = evalAt(params.height + EPS);
    if (powMinus === null || powPlus === null)
        return null;

    return Math.abs((powPlus - powMinus) / (2 * EPS));
}

// Wind HWI Diff: how much HWI changes per 1m/s of EFFECTIVE crosswind.
function computeWindHwiDiff(power_player, club, shot, power_shot, params, HWIMultiplier) {
    const EPS = 0.1; // m/s

    const evalAt = (signedOffset) => {
        const w = params.wind + signedOffset;
        const windMag = w >= 0 ? w : -w;
        const deg = w >= 0 ? params.degree : (((params.degree + 180) % 360) + 360) % 360;
        const r = solveShot(power_player, club, shot, power_shot,
            params.distance, params.height, windMag, deg, params.ground, params.spin, params.curve, params.slope);
        if (!r.ok)
            return null;
        const hwi = (desvioByDegree(r.desvio, params.distance) / 0.2167) * HWIMultiplier;
        // Guard against the near-perpendicular case: when wind is close to pure headwind/tailwind
        // (degree near 0/180 relative to aim), sin(degree-aim) approaches 0.
        const sinComponent = Math.sin((deg * Math.PI / 180) - r.aim);
        // if (Math.abs(sinComponent) < MIN_EFFECTIVE_TRIG)
        //    return null;
        return hwi / (windMag * Math.abs(sinComponent));
    };

    const normMinus = evalAt(-EPS);
    const normPlus = evalAt(EPS);
    if (normMinus === null || normPlus === null)
        return null;

    return Math.abs((normPlus - normMinus) / (2 * EPS));
}

// HWI Height Diff: how much HWI changes per 1m of elevation.
function computeHeightHwiDiff(power_player, club, shot, power_shot, params, HWIMultiplier) {
    const EPS = 0.1; // m

    const evalAt = (height) => {
        const r = solveShot(power_player, club, shot, power_shot,
            params.distance, height, params.wind, params.degree, params.ground, params.spin, params.curve, params.slope);
        if (!r.ok)
            return null;
        const hwi = (desvioByDegree(r.desvio, params.distance) / 0.2167) * HWIMultiplier;
        const sinComponent = Math.sin((params.degree * Math.PI / 180) - r.aim);
        //if (Math.abs(sinComponent) < MIN_EFFECTIVE_TRIG)
        //    return null;
        return hwi / (params.wind * Math.abs(sinComponent));
    };

    const normMinus = evalAt(params.height - EPS);
    const normPlus = evalAt(params.height + EPS);
    if (normMinus === null || normPlus === null)
        return null;

    return Math.abs((normPlus - normMinus) / (2 * EPS));
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

    for (let i = 0; i < sweepValues.length; i++) {
        const params = { ...fixed };
        params[sweepKey] = sweepValues[i];

        const r = solveShot(power_player, club, shot, power_shot,
            params.distance, params.height, params.wind, params.degree,
            params.ground, params.spin, params.curve, params.slope);

        myanswer.okList.push(r.ok);

        if (r.ok) {
            successCount++;
            const hwi = (desvioByDegree(r.desvio, params.distance) / 0.2167) * mydata.HWIMultiplier;
            const powY = r.power_range * r.power;
            myanswer.powerList.push(r.power * 100);
            myanswer.hwilist.push(hwi);
            if (mydata.Aim !== 1) {
                myanswer.hwiaimlist.push(hwi / mydata.Aim);
            }
            myanswer.shotpowerlist.push(powY);

            myanswer.deltaPowList.push(baselinePow !== null ? (powY - baselinePow) : null);
            myanswer.hRateList.push((baselinePow !== null && sweepValues[i] !== 0)
                ? (powY - baselinePow) / sweepValues[i] : null);
            myanswer.deltaHwiList.push(baselineHwi !== null ? (hwi - baselineHwi) : null);
            // HWI Adj normalized by the effective crosswind component: wind * sin(degree - aim),
            // using this row's own solved aim (r.aim), not the raw wind-degree relative to the
            // target line. This is the component of wind actually perpendicular to the ball's
            // real flight direction, which is what drives lateral deviation (HWI).
            const effectiveCrosswind = params.wind * Math.abs(Math.sin((params.degree * Math.PI / 180) - r.aim));
            myanswer.hwiAdjList.push((baselineHwi !== null && effectiveCrosswind !== 0)
                ? (hwi - baselineHwi) / (effectiveCrosswind * Math.abs(sweepValues[i])) : null);
            myanswer.windEffDiffList.push(computeWindEffDiff(power_player, club, shot, power_shot, params));
            myanswer.powDiffList.push(computeHeightPowDiff(power_player, club, shot, power_shot, params, r.aim));
            myanswer.hwiDiffList.push(computeWindHwiDiff(power_player, club, shot, power_shot, params, mydata.HWIMultiplier));
            myanswer.hwiHeightDiffList.push(computeHeightHwiDiff(power_player, club, shot, power_shot, params, mydata.HWIMultiplier));
            
        } else {
            myanswer.powerList.push(null);
            myanswer.hwilist.push(null);
            if (mydata.Aim !== 1) {
                myanswer.hwiaimlist.push(null);
            }
            myanswer.shotpowerlist.push(null);
            myanswer.deltaPowList.push(null);
            myanswer.hRateList.push(null);
            myanswer.deltaHwiList.push(null);
            myanswer.hwiAdjList.push(null);
            myanswer.windEffDiffList.push(null);
            myanswer.powDiffList.push(null);
            myanswer.hwiDiffList.push(null);
            myanswer.hwiHeightDiffList.push(null);
        }

        updateProgress(i + 1, total);
        await yieldToBrowser();
    }

    hideProgress();
    
    const info1 = DATATYPE_INFO[mydata.datatype];
    const start = mydata[info1.startField];
    const end = mydata[info1.endField];
    
    // 1. Define your designated first 22 rows (AOA format)
    const designatedHeaderRows = [
        ['Summary', ''],
        [],
        ['Type:', info.label],
        ['Range:', `${start}`,` ${end}`],
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

        ...(baselinePow !== null && {
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
            'HWI Adj': (myanswer.okList[i] && myanswer.hwiAdjList[i] !== null) ? Number(myanswer.hwiAdjList[i].toFixed(4)) : '-',
        }),

        // HWI Adj Diff = HWI Adj diff per 1m elevation, computed as a local numerical derivative at
        // this row's own elevation (see computeWindHwiDiff). [Any mode]
        'HWI Height Diff': (myanswer.okList[i] && myanswer.hwiHeightDiffList[i] !== null) ? Number(myanswer.hwiHeightDiffList[i].toFixed(4)) : '-',

        // Wind Eff Diff = Pow (y) diff per 1 m/s wind, computed as a local numerical
        // derivative at this row's own wind/degree (see computeWindEffDiff). [Any mode]
        'Wind Pow Diff': (myanswer.okList[i] && myanswer.windEffDiffList[i] !== null) ? Number(myanswer.windEffDiffList[i].toFixed(4)) : '-',
        
        // HWI Diff = HWI diff per 1 m/s wind, computed as a local numerical derivative at
        // this row's own wind/degree (see computeWindHwiDiff). [Any mode]
        'Wind HWI Diff': (myanswer.okList[i] && myanswer.hwiDiffList[i] !== null) ? Number(myanswer.hwiDiffList[i].toFixed(4)) : '-',
        
        
    }));

    // 3. Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(designatedHeaderRows);
    XLSX.utils.sheet_add_json(worksheet, rows, { origin: 'A22' });

    // 4. Save Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Answers');

    const filename = `pangya_export_${info.label.replace(/[^A-Za-z]/g, '')}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, filename);

    result.style.color = successCount > 0 ? 'Pink' : 'Red';
    result.innerHTML = `Exported ${rows.length} rows (${successCount} solved, ${rows.length - successCount} failed) to ${filename}`;
}