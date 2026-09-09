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

function calculeTypeDistanceByPosition(position1, position2) {
    return calculeTypeDistance(Math.sqrt(Math.pow(position1.x - position2.x) + Math.pow(position1.z - position2.z)) * 0.3125);
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

        // init max_height
        this.ball.max_height = this.ball.position.y;

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

            this.ball.max_height = this.ball.position.y;
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

const diffYZ = function(vect1, vect2) {
    return Math.sqrt(Math.pow(vect1.x - vect2.x, 2) + Math.pow(vect1.z - vect2.z, 2));
};

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

function desvioByDegree(yards, distance) {
    return Math.sin(Math.atan2(yards * -1.5, distance)) * distance / 1.5;
}


// =====================================================================================
// Pin Exporter — sweep & export engine
// Everything above this line is the untouched physics/answer-finding engine
// (copied verbatim from AnswerFinder/smart_calculator.js: Vector3D, Ball, Club, Wind,
// QuadTree, find_power, and small helpers). Nothing in that section is modified here.
//
// Everything below is new: it drives that engine over 1 or 2 swept variables and
// builds an .xlsx export, in the same spirit as the existing single-variable exporter.
// =====================================================================================

// Which of the 8 sweepable fields map to which input_values key, plus the id prefix
// used by the two range grids ("start"/"end") in the page.
const SWEEP_FIELDS = {
    distance: { key: 'distance', label: 'Distance', idPrefix: 'distance', summaryLabel: 'Dist' },
    height:   { key: 'height',   label: 'Height',   idPrefix: 'height',   summaryLabel: 'Height' },
    wind:     { key: 'wind',     label: 'Wind',      idPrefix: 'wind',     summaryLabel: 'Wind' },
    degree:   { key: 'degree',   label: 'W Deg',     idPrefix: 'degree',   summaryLabel: 'W Deg' },
    slope:    { key: 'slope',    label: 'Slope',     idPrefix: 'slope',    summaryLabel: 'Slope' },
    ground:   { key: 'ground',   label: 'Ground',    idPrefix: 'ground',   summaryLabel: 'Ground' },
    spin:     { key: 'spin',     label: 'Spin',      idPrefix: 'spin',     summaryLabel: 'Spin' },
    curve:    { key: 'curva',    label: 'Curve',     idPrefix: 'curve',    summaryLabel: 'Curve' },
};
const SWEEP_TYPE_ORDER = ['distance', 'height', 'wind', 'degree', 'slope', 'ground', 'spin', 'curve'];

// -------------------------------------------------------------------------------------
// Range enumeration.
// The original single-variable loop used `Math.Abs`, which does not exist in
// JavaScript (`Math.abs` does) and would throw/underflow rather than sweep. This
// replacement just enumerates start..end (inclusive of both ends) in steps of `freq`,
// walking in whichever direction end is from start.
// -------------------------------------------------------------------------------------
function generateRange(start, end, freq) {
    start = Number(start);
    end = Number(end);
    freq = Math.abs(Number(freq)) || 1;

    if (!isFinite(start) || !isFinite(end))
        return [start];

    if (start === end)
        return [start];

    const dir = end > start ? 1 : -1;
    const span = Math.abs(end - start);
    const steps = Math.floor(span / freq + 1e-9);

    const values = [];
    for (let i = 0; i <= steps; i++) {
        values.push(Math.round((start + dir * i * freq) * 1e6) / 1e6);
    }
    // Make sure the requested end value is included even if it doesn't land exactly
    // on a step boundary (mirrors how the reference exports always show the full range).
    const last = values[values.length - 1];
    if (Math.abs(last - end) > 1e-6)
        values.push(Math.round(end * 1e6) / 1e6);

    return values;
}

// -------------------------------------------------------------------------------------
// Silent aim-refinement solver.
//
// This is the exact same fixed-point algorithm used interactively in
// AnswerFinder/smart_calculator.js's calc() — G(aim) = atan2(desvio(aim)*1.5, distance)
// - aim, coarse outward scan from aim=0, bisection with a gap-rescue probe — just
// stripped of the alert() calls (which would otherwise pop up per shot per iteration
// during a sweep of hundreds/thousands of shots) and returning its result instead of
// writing to the page. The math itself is untouched.
// -------------------------------------------------------------------------------------
function solveAim(input_values) {
    const found = find_power(input_values.power_player, input_values.club_info, input_values.shot, input_values.power_shot,
        input_values.distance, input_values.height, input_values.wind, input_values.degree,
        input_values.ground, input_values.spin, input_values.curva, input_values.slope);

    if (found.power == -1)
        return { success: false, steps: 1 };

    let steps = 1;
    const AIM_SCAN_STEP = 0.01 * Math.PI;
    const AIM_SCAN_MAX_STEPS = 100;
    const AIM_BISECT_MAX_ITER = 100;
    const AIM_CONVERGE_THRESHOLD = 0.00001;

    const tryAim = (aim, warmPower) => find_power(
        input_values.power_player, input_values.club_info, input_values.shot, input_values.power_shot,
        input_values.distance, input_values.height, input_values.wind, input_values.degree,
        input_values.ground, input_values.spin, input_values.curva, input_values.slope,
        aim, warmPower
    );
    const fixedPointGap = (r, aim) => Math.atan2(r.desvio * 1.5, input_values.distance) - aim;

    const baseGap = fixedPointGap(found, 0);
    if (Math.abs(baseGap) < AIM_CONVERGE_THRESHOLD)
        return { success: true, result: found, steps };

    let bracketLoAim = null, bracketLoGap = null, bracketHiAim = null;

    scanLoop:
    for (const dir of [1, -1]) {
        let prevAim = 0, prevGap = baseGap, prevPower = found.power;
        for (let step = 1; step <= AIM_SCAN_MAX_STEPS; step++) {
            const aim = dir * AIM_SCAN_STEP * step;
            const r = tryAim(aim, prevPower);
            steps++;
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

    if (bracketLoAim === null)
        return { success: false, steps };

    let loAim = bracketLoAim, loGap = bracketLoGap, hiAim = bracketHiAim;
    let warmPower = found.power;
    let lastR = null;

    for (let i = 0; i < AIM_BISECT_MAX_ITER; i++) {
        let midAim = (loAim + hiAim) / 2;
        let r = tryAim(midAim, warmPower);
        steps++;

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
                steps++;
                if (pr.power != -1) {
                    midAim = probeAim;
                    r = pr;
                    rescued = true;
                    break;
                }
            }
            if (!rescued)
                return { success: false, steps };
        }

        warmPower = r.power;
        lastR = r;
        const gap = fixedPointGap(r, midAim);

        if (Math.abs(gap) < AIM_CONVERGE_THRESHOLD)
            return { success: true, result: r, steps };

        if (Math.sign(gap) === Math.sign(loGap)) {
            loAim = midAim;
            loGap = gap;
        } else {
            hiAim = midAim;
        }
    }

    // Bisection budget exhausted without hitting the threshold; the interactive tool
    // in this situation still uses the last attempt (f[index_f]) as its answer, so we
    // mirror that here rather than treating it as a failure.
    return lastR ? { success: true, result: lastR, steps } : { success: false, steps };
}

// Builds the small set of "display" values (Pow %, Pow yards, AIM, HWI) from a solved
// shot the exact same way the interactive calculator's result panel does.
function toDisplayRow(input_values, solved, dis, aimX) {
    if (!solved.success)
        return null;

    const r = solved.result;
    const powPercent = r.power * 100;
    const powYard = r.power_range * r.power;
    const hwi = (desvioByDegree(r.desvio, input_values.distance) / 0.2167) * dis;
    const aim = aimX ? hwi / aimX : 0;

    return { powPercent, powYard, hwi, aim };
}

// Local sensitivity of Pow(y) and HWI to a given field, evaluated at the current point
// via a small central-difference perturbation (default step: 0.1 unit). Matches the
// "change per 1m" / "change per 1m/s" wording in the sheet's Note section.
//
// NOTE on sign/pairing, both confirmed empirically against the reference exports:
//  - Height Pow Diff  = +d(Pow)/d(height)
//  - Height HWI Diff  = -d(HWI)/d(height)
//  - Wind Pow Diff     = +d(Pow)/d(wind)      (sensitivity to wind *magnitude*)
//  - Wind HWI Diff     = +d(HWI)/d(wind)    (sensitivity to wind magnitude)
function localDerivative(baseParams, dis, aimX, key) {
    const eps = 0.1;
    const plus = Object.assign({}, baseParams);
    const minus = Object.assign({}, baseParams);
    plus[key] += eps;
    minus[key] -= eps;

    const rp = solveAim(plus);
    const rm = solveAim(minus);
    if (!rp.success || !rm.success)
        return null;

    const rowP = toDisplayRow(plus, rp, dis, aimX);
    const rowM = toDisplayRow(minus, rm, dis, aimX);

    return {
        pow: (rowP.powYard - rowM.powYard) / (2 * eps),
        hwi: (rowP.hwi - rowM.hwi) / (2 * eps),
    };
}

// -------------------------------------------------------------------------------------
// Sweep driver
// -------------------------------------------------------------------------------------

// Computes one full row (all columns) for a single point of the swept variable.
// `baseline` (optional) is retained for compatibility with the original sweep path.
// Height-relative columns are finalized later against an explicit height == 0 solve.
function computeSweepRow(fixedParams, varKey, value, dis, aimX, baseline, includeSensitivity) {
    const params = Object.assign({}, fixedParams);
    params[varKey] = value;

    const solved = solveAim(params);
    const row = { value, success: solved.success, steps: solved.steps };

    if (!solved.success)
        return row;

    const disp = toDisplayRow(params, solved, dis, aimX);
    row.powPercent = disp.powPercent;
    row.powYard = disp.powYard;
    row.aim = disp.aim;
    row.hwi = disp.hwi;

    if (includeSensitivity) {
        const heightDeriv = localDerivative(params, dis, aimX, 'height');
        const windDeriv = localDerivative(params, dis, aimX, 'wind');
        row.heightPowDiff = heightDeriv ? heightDeriv.pow : null;
        row.heightHwiDiff = heightDeriv ? -heightDeriv.hwi : null;
        row.windPowDiff = windDeriv ? windDeriv.pow : null;
        row.windHwiDiff = windDeriv ? windDeriv.hwi : null;
    }

    if (baseline) {
        row.deltaPow = disp.powYard - baseline.powYard;
        row.deltaHwi = disp.hwi - baseline.hwi;
        row.h = value !== 0 ? row.deltaPow / value : null;
        row.hwiAdj = value !== 0 ? row.deltaHwi / value : null;
    }

    return row;
}

// Sweeps one variable across `values`, holding everything else in fixedParams fixed.
// Returns { rows, success, failure }.
async function sweepOneVariable(fixedParams, varKey, values, dis, aimX, includeSensitivity, includeBaseline, onProgress) {
    let baseline = null;
    if (includeBaseline && values.includes(0)) {
        const baseParams = Object.assign({}, fixedParams);
        baseParams[varKey] = 0;
        const solvedBase = solveAim(baseParams);
        if (solvedBase.success)
            baseline = toDisplayRow(baseParams, solvedBase, dis, aimX);
    }

    const rows = [];
    let success = 0, failure = 0;

    for (const value of values) {
        const row = computeSweepRow(fixedParams, varKey, value, dis, aimX, baseline, includeSensitivity);
        rows.push(row);
        if (row.success) success++; else failure++;

        if (onProgress)
            onProgress(rows.length, values.length, row);

        // Let the browser paint progress.
        // if (rows.length % 10 === 0 || rows.length === values.length)
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return { rows, success, failure };
}

// -------------------------------------------------------------------------------------
// Multithreaded sweep driver (Web Worker pool)
// -------------------------------------------------------------------------------------
//
// The math itself (find_power / solveAim / computeSweepRow) is completely
// untouched -- sweep_worker.js just importScripts()s this same file and calls
// the exact same functions. This section only adds the *scheduling* layer:
// splitting the sweep into independent chunks, running them across a pool of
// Workers (one per CPU core, roughly), and reassembling the results in the
// original order. sweepOneVariable() above is kept as-is and used as an
// automatic single-threaded fallback if Workers aren't available/usable in
// the current environment (e.g. opened directly from disk as a file:// page
// in a browser that blocks Worker scripts there).

// postMessage() (used to hand a task to a Worker) structured-clones its
// payload, and the structured-clone algorithm *throws* DataCloneError the
// instant it encounters a function value -- it does not just silently drop
// it. fixedParams.power_player.options.total is a real function, so it has
// to be stripped out before the object is ever posted. sweep_worker.js's
// reviveFixedParams() reattaches an identical function once the clone lands
// in the worker. Everything else on fixedParams (plain numbers, club_info's
// plain fields, and even a Vector3D-instance `slope`) clones fine on its own
// -- class instances just get demoted to plain objects, they don't throw.
function makeCloneableFixedParams(fixedParams) {
    const powerPlayer = fixedParams.power_player;
    if (!powerPlayer || !powerPlayer.options || typeof powerPlayer.options.total !== 'function')
        return fixedParams;

    const options = Object.assign({}, powerPlayer.options);
    delete options.total;

    return Object.assign({}, fixedParams, {
        power_player: Object.assign({}, powerPlayer, { options }),
    });
}

function getSweepWorkerCount() {
    const hc = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
    return Math.max(1, Math.min(hc, 8));
}

function canUseSweepWorkers() {
    return typeof Worker !== 'undefined';
}

// Small pool of persistent Workers pulling tasks off a shared queue (rather
// than pre-assigning a fixed slice to each worker), so a worker that finishes
// its rows quickly immediately picks up more instead of sitting idle while a
// slower worker (e.g. one that happened to land on harder-to-bisect shots)
// is still working through its chunk.
class SweepWorkerPool {
    constructor(size) {
        this.workers = [];
        for (let i = 0; i < size; i++)
            this.workers.push(new Worker('sweep_worker.js'));
    }

    terminate() {
        for (const worker of this.workers)
            worker.terminate();
    }

    // tasks: array of task objects (each with a unique taskId).
    // onProgress(taskId, completed): a task reported it has finished `completed` of its rows so far.
    // onTaskDone(result): a task finished completely; result = {taskId, blockIndex, startIndex, rows, success, failure}.
    run(tasks, onProgress, onTaskDone) {
        return new Promise((resolve, reject) => {
            if (tasks.length === 0) {
                resolve();
                return;
            }

            let nextIndex = 0;
            let remaining = tasks.length;
            let settled = false;

            const fail = (err) => {
                if (settled) return;
                settled = true;
                reject(err);
            };

            const assignNext = (worker) => {
                if (nextIndex >= tasks.length)
                    return;
                worker.postMessage(tasks[nextIndex++]);
            };

            for (const worker of this.workers) {
                worker.onmessage = (e) => {
                    const msg = e.data;
                    if (msg.type === 'progress') {
                        onProgress(msg.taskId, msg.completed);
                    } else if (msg.type === 'done') {
                        onTaskDone(msg);
                        remaining--;
                        if (remaining === 0) {
                            if (!settled) {
                                settled = true;
                                resolve();
                            }
                        } else {
                            assignNext(worker);
                        }
                    } else if (msg.type === 'error') {
                        fail(new Error(msg.message));
                    }
                };
                worker.onerror = (err) => {
                    fail(err instanceof Error ? err : new Error(err && err.message ? err.message : 'Worker error'));
                };
                assignNext(worker);
            }
        });
    }
}

// Runs the full 1- or 2-variable sweep across a pool of Workers.
// blockDefs: [{ label, fixedParams }] -- one entry per var2 value, or a single
// { label: null, fixedParams } entry when there's no second swept variable.
// Returns the same shape exportSweep()/buildAndDownloadWorkbook() already
// expect: [{ label, rows, success, failure }].
async function runSweepParallel(blockDefs, var1, values1, dis, aimX, includeSensitivity, onStatus) {
    const workerCount = getSweepWorkerCount();
    const pool = new SweepWorkerPool(workerCount);

    const totalPoints = values1.length * blockDefs.length;
    let completedPoints = 0;
    const taskLastCompleted = new Map();

    const blockRows = blockDefs.map(() => new Array(values1.length));
    const blockStats = blockDefs.map(() => ({ success: 0, failure: 0 }));

    const needBaseline = values1.includes(0);
    const chunkCount = Math.max(1, Math.min(workerCount, values1.length));
    const chunkSize = Math.ceil(values1.length / chunkCount);

    const tasks = [];
    let taskId = 0;
    for (let b = 0; b < blockDefs.length; b++) {
        // The structured-clone algorithm postMessage() uses to hand this object
        // to a Worker throws (rather than just dropping it) the moment it hits
        // a function value, so power_player.options.total must be stripped out
        // here -- BEFORE it's ever posted -- not just reattached on the worker
        // side. sweep_worker.js's reviveFixedParams() puts it back once the
        // (now function-free) clone lands there.
        const cloneableFixedParams = makeCloneableFixedParams(blockDefs[b].fixedParams);
        for (let start = 0; start < values1.length; start += chunkSize) {
            tasks.push({
                taskId: taskId++,
                blockIndex: b,
                startIndex: start,
                fixedParams: cloneableFixedParams,
                varKey: var1.def.key,
                values: values1.slice(start, start + chunkSize),
                dis,
                aimX,
                includeSensitivity,
                needBaseline,
            });
        }
    }

    try {
        await pool.run(
            tasks,
            (id, completed) => {
                const prev = taskLastCompleted.get(id) || 0;
                completedPoints += (completed - prev);
                taskLastCompleted.set(id, completed);
                if (onStatus)
                    onStatus(completedPoints, totalPoints);
            },
            (result) => {
                const rows = blockRows[result.blockIndex];
                for (let i = 0; i < result.rows.length; i++)
                    rows[result.startIndex + i] = result.rows[i];
                blockStats[result.blockIndex].success += result.success;
                blockStats[result.blockIndex].failure += result.failure;
            }
        );
    } finally {
        pool.terminate();
    }

    return blockDefs.map((def, b) => ({
        label: def.label,
        rows: blockRows[b],
        success: blockStats[b].success,
        failure: blockStats[b].failure,
    }));
}

// Original single-threaded path, used automatically if Workers aren't
// available/usable. Behaviorally identical to the sweep this replaced.
async function runSweepSerial(blockDefs, var1, var2, values1, shared, includeSensitivity) {
    const blocks = [];
    const totalPoints = values1.length * blockDefs.length;

    for (let i = 0; i < blockDefs.length; i++) {
        const def = blockDefs[i];
        const result = await sweepOneVariable(def.fixedParams, var1.def.key, values1, shared.dis, shared.aimX, includeSensitivity, true,
            (completed) => {
                const overallCompleted = i * values1.length + completed;
                if (var2)
                    setExportStatus(`กำลังคำนวณ ${overallCompleted}/${totalPoints} (${var2.def.label} ${i + 1}/${blockDefs.length}, ${var1.def.label} ${completed}/${values1.length})`);
                else
                    setExportStatus(`กำลังคำนวณ ${completed}/${values1.length} (${var1.def.label})`);
            });
        blocks.push({ label: def.label, rows: result.rows, success: result.success, failure: result.failure });
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return blocks;
}

function formatParallelSweepStatus(completed, total, var1, var2) {
    const suffix = var2 ? `${var1.def.label} × ${var2.def.label}` : var1.def.label;
    // return `กำลังคำนวณ ${overallCompleted}/${totalPoints} (${var2.def.label} ${i + 1}/${blockDefs.length}, ${var1.def.label} ${completed}/${values1.length})`
    return `กำลังคำนวณ ${completed}/${total} (${suffix}, ใช้ ${getSweepWorkerCount()} threads)`;
}


// -------------------------------------------------------------------------------------
// UI glue: reading the page, running the sweep(s), and writing the .xlsx file.
// -------------------------------------------------------------------------------------

// Lets up to TWO of the eight Data checkboxes be ticked at once (instead of one).
// While fewer than 2 are ticked, ticking/unticking behaves as before (enables/disables
// that row's "end" input). Once 2 are ticked, every other still-unticked checkbox is
// disabled so a 3rd can't be selected; unticking one re-enables the rest.
function tickCheckBox(box) {
    const Containers = document.querySelectorAll('.container-grid-fivecolumn');

    let checkedCount = 0;
    for (const container of Containers) {
        if (container.querySelector('.databool').checked)
            checkedCount++;
    }

    for (const container of Containers) {
        const CheckBox = container.querySelector('.databool');
        const DestinationData = container.querySelector('.destinationdata');

        if (CheckBox.checked) {
            DestinationData.disabled = false;
            CheckBox.disabled = false;
        } else {
            DestinationData.disabled = true;
            DestinationData.value = '';
            CheckBox.disabled = checkedCount >= 2;
        }
    }

}

// Returns the checked field types in top-to-down page order (distance, height, wind,
// degree, slope, ground, spin, curve — the same order they appear in the form). With
// tickCheckBox() above capping the count at 2, this returns 0, 1, or 2 entries. The
// first entry sweeps with Freq1 and the second (if any) with Freq2.
function getCheckedTypesInOrder() {
    const types = [];
    for (const type of SWEEP_TYPE_ORDER) {
        const el = document.getElementById(type + 'checkbox');
        if (el && el.checked)
            types.push(type);
    }

    return types;
}

function getSharedShotConfig() {
    const power = checkValidInput(document.getElementById('power').value);
    const auxpart_pwr = checkValidInput(document.getElementById('auxpart_pwr').value);
    const card_pwr = checkValidInput(document.getElementById('card_pwr').value);
    const mascot_pwr = checkValidInput(document.getElementById('mascot_pwr').value);
    const card_ps_pwr = checkValidInput(document.getElementById('card_ps_pwr').value);

    const clubEl = document.getElementById('club');
    const clubValue = clubEl.options[clubEl.selectedIndex].value;
    const club_info = CLUB_INFO[CLUB_INFO_ENUM[clubValue]];
    const clubLabel = clubEl.options[clubEl.selectedIndex].text;

    const shotEl = document.getElementById('shot');
    const shotValue = shotEl.options[shotEl.selectedIndex].value;
    const shot = SHOT_TYPE[SHOT_TYPE_ENUM[shotValue]];
    const shotLabel = shotEl.options[shotEl.selectedIndex].text;

    const psEl = document.getElementById('power_shot');
    const psValue = psEl.options[psEl.selectedIndex].value;
    const power_shot = POWER_SHOT_FACTORY[POWER_SHOT_FACTORY_ENUM[psValue]];
    const psLabel = psEl.options[psEl.selectedIndex].text;

    const dis = checkValidInput(document.getElementById('dis').value) || 1;
    const aimX = checkValidInput(document.getElementById('aim').value) || 4;

    const power_player = {
        pwr: power,
        options: {
            auxpart: auxpart_pwr,
            mascot: mascot_pwr,
            card: card_pwr,
            ps_auxpart: 0,
            ps_mascot: 0,
            ps_card: card_ps_pwr,
            total: function (option) {
                let pwr = this.auxpart + this.mascot + this.card;
                if (option == 1 || option == 2 || option == 3)
                    pwr += this.ps_auxpart + this.ps_mascot + this.ps_card;
                return pwr;
            }
        }
    };

    return { power_player, club_info, shot, power_shot, dis, aimX, clubLabel, shotLabel, psLabel };
}

// "ClubConf" summary label, e.g. "266+0" — the club's total effective power range for
// a normal shot, plus whatever extra a power-shot card would add (0 unless a
// power-shot-only card stat is configured, since that only applies when Power Shot is
// actually used). Needs a representative distance because PW/SW ranges are
// distance-bucketed; any distance in the sweep works since it only changes which
// bucket a PW/SW shot falls into, not the wood/iron formula used by default clubs.
function computeClubConfLabel(shared, representativeDistance) {
    const vclub = new Club();
    vclub.init(shared.club_info);
    vclub.type_distance = calculeTypeDistance(representativeDistance);
    const normalRange = vclub.getRange(shared.power_player.options, shared.power_player.pwr, POWER_SHOT_FACTORY.NO_POWER_SHOT);
    const psRange = vclub.getRange(shared.power_player.options, shared.power_player.pwr, shared.power_shot);
    const extra = Math.round((psRange - normalRange) * 100) / 100;
    return `${Math.round(normalRange)}+${extra}`;
}

// Fixed ("Init Val") value for every field, taken from each field's "start" (…1) input,
// same convention the single-variable exporter already used.
function getFixedFieldValues() {
    const values = {};
    for (const type of SWEEP_TYPE_ORDER) {
        const def = SWEEP_FIELDS[type];
        const startVal = type === 'slope'
            ? checkValidInputSlope(document.getElementById(def.idPrefix + '1').value)
            : checkValidInput(document.getElementById(def.idPrefix + '1').value);
        values[def.key] = startVal;
    }
    return values;
}

function buildFixedParams(shared, fixedFieldValues) {
    return Object.assign(
        { power_player: shared.power_player, club_info: shared.club_info, shot: shared.shot, power_shot: shared.power_shot },
        fixedFieldValues
    );
}

function readVar1() {
    const types = getCheckedTypesInOrder();
    if (types.length === 0)
        return null;
    const type = types[0];
    const def = SWEEP_FIELDS[type];
    // Sweeping needs a plain numeric range even for the "slope" field (which, when
    // used as a *fixed* value elsewhere, may also accept the "x,y,z" vector form).
    const startInput = document.getElementById(def.idPrefix + '1').value;
    const endInput = document.getElementById(def.idPrefix + '2').value;
    const freqInput = document.getElementById('datafrequency').value;
    const start = checkValidInput(startInput);
    const end = checkValidInput(endInput);
    const freq = checkValidInput(freqInput) || 1;
    const decimals = Math.max(
        decimalPlacesInInput(startInput),
        decimalPlacesInInput(endInput),
        decimalPlacesInInput(freqInput)
    );
    return { type, def, start, end, freq, decimals };
}

function readVar2() {
    const types = getCheckedTypesInOrder();
    if (types.length < 2)
        return null;
    const type = types[1];
    const def = SWEEP_FIELDS[type];
    const start = checkValidInput(document.getElementById(def.idPrefix + '1').value);
    const end = checkValidInput(document.getElementById(def.idPrefix + '2').value);
    const freq = checkValidInput(document.getElementById('data2freq').value) || 1;
    const startInput = document.getElementById(def.idPrefix + '1').value;
    const endInput = document.getElementById(def.idPrefix + '2').value;
    const freqInput = document.getElementById('data2freq').value;
    const decimals = Math.max(
        decimalPlacesInInput(startInput),
        decimalPlacesInInput(endInput),
        decimalPlacesInInput(freqInput)
    );
    return { type, def, start, end, freq, decimals };
}

function setExportStatus(msg) {
    const el = document.getElementById('export-status');
    if (el) el.innerText = msg;
}

async function runSweepOrientation(var1, var2, fixedParams, shared, includeSensitivity, statusPrefix) {
    const values1 = generateRange(var1.start, var1.end, var1.freq);
    const blockDefs = [];
    let values2 = null;

    if (var2) {
        values2 = generateRange(var2.start, var2.end, var2.freq);
        for (const v2 of values2) {
            const blockParams = Object.assign({}, fixedParams);
            blockParams[var2.def.key] = v2;
            blockDefs.push({ label: v2, fixedParams: blockParams });
        }
    } else {
        blockDefs.push({ label: null, fixedParams });
    }

    const totalPoints = values1.length * blockDefs.length;
    const updateStatus = (completed, total) => {
        const suffix = var2 ? `${var1.def.label} × ${var2.def.label}` : var1.def.label;
        const prefix = statusPrefix ? `${statusPrefix}: ` : '';
        setExportStatus(`${prefix}กำลังคำนวณ ${completed}/${total} (${suffix}, ใช้ ${getSweepWorkerCount()} threads)`);
    };

    let blocks;
    if (canUseSweepWorkers()) {
        try {
            blocks = await runSweepParallel(blockDefs, var1, values1, shared.dis, shared.aimX,
                includeSensitivity, updateStatus);
        } catch (err) {
            console.warn('Multithreaded sweep failed, falling back to single-threaded sweep:', err);
            blocks = await runSweepSerial(blockDefs, var1, var2, values1, shared, includeSensitivity);
        }
    } else {
        blocks = await runSweepSerial(blockDefs, var1, var2, values1, shared, includeSensitivity);
    }

    let success = 0, failure = 0;
    for (const block of blocks) {
        success += block.success;
        failure += block.failure;
    }

    return { var1, var2, values1, blocks, success, failure };
}

function makeSweepPointKey(params) {
    return JSON.stringify(SWEEP_TYPE_ORDER.map((type) => params[SWEEP_FIELDS[type].key]));
}

function buildSweepCache(sweep, fixedParams) {
    const cache = new Map();
    for (const block of sweep.blocks) {
        for (const row of block.rows) {
            const params = Object.assign({}, fixedParams, {
                [sweep.var1.def.key]: row.value,
            });
            if (sweep.var2)
                params[sweep.var2.def.key] = block.label;

            const cachedRow = Object.assign({}, row);
            delete cachedRow.deltaPow;
            delete cachedRow.deltaHwi;
            delete cachedRow.h;
            delete cachedRow.hwiAdj;
            cache.set(makeSweepPointKey(params), cachedRow);
        }
    }
    return cache;
}

async function runCachedSweepParallel(var1, var2, fixedParams, values1, values2, cache, statusPrefix) {
    const workerCount = getSweepWorkerCount();
    const cacheEntries = Array.from(cache.entries());
    const blockCount = values2.length;
    const chunkCount = Math.max(1, Math.min(workerCount, blockCount));
    const chunkSize = Math.ceil(blockCount / chunkCount);
    const tasks = [];

    for (let start = 0; start < blockCount; start += chunkSize) {
        tasks.push({
            type: 'cachedSweep',
            taskId: tasks.length,
            startIndex: start,
            cacheEntries,
            fixedParams: makeCloneableFixedParams(fixedParams),
            var1Key: var1.def.key,
            var2Key: var2 ? var2.def.key : null,
            blocks: values2.slice(start, start + chunkSize).map((label) => ({ label, values1 })),
        });
    }

    const blockResults = new Array(blockCount);
    const pool = new SweepWorkerPool(Math.min(workerCount, tasks.length));
    try {
        await pool.run(tasks, () => {}, (result) => {
            for (let i = 0; i < result.blocks.length; i++)
                blockResults[result.startIndex + i] = result.blocks[i];
            if (statusPrefix)
                setExportStatus(`${statusPrefix}: completed ${result.startIndex + result.blocks.length}/${blockCount} cached blocks`);
        });
    } finally {
        pool.terminate();
    }

    let success = 0;
    let failure = 0;
    for (const block of blockResults) {
        success += block.success;
        failure += block.failure;
    }
    return { var1, var2, values1, blocks: blockResults, success, failure, fromCache: true };
}

async function runCachedSweepOrientation(var1, var2, fixedParams, shared, cache, statusPrefix) {
    const values1 = generateRange(var1.start, var1.end, var1.freq);
    const values2 = var2 ? generateRange(var2.start, var2.end, var2.freq) : [null];

    if (canUseSweepWorkers()) {
        try {
            return await runCachedSweepParallel(var1, var2, fixedParams, values1, values2, cache, statusPrefix);
        } catch (err) {
            console.warn('Parallel cached sweep failed, falling back to single-threaded cache lookup:', err);
        }
    }

    const blocks = [];
    let success = 0, failure = 0;
    let completed = 0;
    const total = values1.length * values2.length;

    for (const value2 of values2) {
        const rows = [];
        for (const value1 of values1) {
            const params = Object.assign({}, fixedParams, {
                [var1.def.key]: value1,
            });
            if (var2)
                params[var2.def.key] = value2;

            const cached = cache.get(makeSweepPointKey(params));
            const row = cached
                ? Object.assign({}, cached, { value: value1 })
                : { value: value1, success: false, steps: 0 };
            rows.push(row);
            if (row.success)
                success++;
            else
                failure++;

            completed++;
            setExportStatus(`Reverse Order: กำลังคำนวณ ${completed}/${total} (${var1.def.label}${var2 ? ` × ${var2.def.label}` : ''}, ใช้ข้อมูล cache)`);
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        blocks.push({ label: value2, rows, success: rows.filter((row) => row.success).length, failure: rows.filter((row) => !row.success).length });
    }

    return { var1, var2, values1, blocks, success, failure, fromCache: true };
}

function getSweepPointParams(sweep, block, row, fixedParams) {
    const params = Object.assign({}, fixedParams, {
        [sweep.var1.def.key]: row.value,
    });
    if (sweep.var2)
        params[sweep.var2.def.key] = block.label;
    return params;
}

function getOrSolveCachedDisplay(params, cache, dis, aimX) {
    const key = makeSweepPointKey(params);
    const cached = cache.get(key);
    if (cached)
        return cached.success ? cached : null;

    const solved = solveAim(params);
    if (!solved.success) {
        cache.set(key, { success: false });
        return null;
    }

    const display = toDisplayRow(params, solved, dis, aimX);
    const cachedDisplay = Object.assign({ success: true, steps: solved.steps }, display);
    cache.set(key, cachedDisplay);
    return cachedDisplay;
}

// H and HWI Adj are always relative to the same shot solved at height 0m,
// never relative to the first value of whichever variable happens to be swept.
// This also applies when Height is fixed and another field is being swept.
async function applyHeightAdjustmentsToSweep(sweep, fixedParams, cache, dis, aimX) {
    const items = [];
    for (const block of sweep.blocks) {
        for (const row of block.rows) {
            if (!row.success)
                continue;

            delete row.deltaPow;
            delete row.deltaHwi;
            delete row.h;
            delete row.hwiAdj;
            delete row.hwiNorm;

            const params = getSweepPointParams(sweep, block, row, fixedParams);
            const height = params.height;
            const currentHwiNorm = hwiNorm(row.hwi, params.wind, params.degree);
            row.hwiNorm = currentHwiNorm;
            const baselineParams = Object.assign({}, params, { height: 0 });
            const baseline = getOrSolveCachedDisplay(baselineParams, cache, dis, aimX);
            if (!baseline)
                continue;

            items.push({ row, params, baseline });
        }
    }

    if (!items.length)
        return;

    if (!canUseSweepWorkers()) {
        for (const item of items) {
            const row = item.row;
            const params = item.params;
            const baseline = item.baseline;
            const height = params.height;
            const currentHwiNorm = hwiNorm(row.hwi, params.wind, params.degree);
            const baselineParams = Object.assign({}, params, { height: 0 });
            const baselineHwiNorm = hwiNorm(baseline.hwi, baselineParams.wind, baselineParams.degree);
            row.hwiNorm = currentHwiNorm;
            row.deltaPow = row.powYard - baseline.powYard;
            row.deltaHwi = row.hwi - baseline.hwi;
            row.h = height !== 0 ? row.deltaPow / height : null;
            row.hwiAdj = height !== 0 ? (currentHwiNorm - baselineHwiNorm) / height : null;
        }
        return;
    }

    const workerCount = getSweepWorkerCount();
    const chunkSize = Math.ceil(items.length / workerCount);
    const tasks = [];
    for (let start = 0; start < items.length; start += chunkSize) {
        tasks.push({
            type: 'heightAdjust',
            taskId: tasks.length,
            blockIndex: 0,
            startIndex: start,
            items: items.slice(start, start + chunkSize).map((item) => ({
                row: item.row,
                params: makeCloneableFixedParams(item.params),
                baseline: item.baseline,
            })),
        });
    }

    const pool = new SweepWorkerPool(Math.min(workerCount, tasks.length));
    try {
        await pool.run(tasks, () => {}, (result) => {
            for (let i = 0; i < result.rows.length; i++)
                Object.assign(items[result.startIndex + i].row, result.rows[i]);
        });
    } finally {
        pool.terminate();
    }
}

// Main entry point wired to the "Export" button.
async function exportSweep() {
    const shared = getSharedShotConfig();
    const fixedFieldValues = getFixedFieldValues();
    const var1 = readVar1();

    if (!var1) {
        alert('เลือกตัวแปร 1-2 ตัว ที่ต้องการสแกนค่า');
        return;
    }

    const var2 = readVar2();
    const roundTrip = Boolean(var2);

    const includeSensitivity = document.getElementById('includeSensitivity')
        ? document.getElementById('includeSensitivity').checked
        : true;

    const fixedParams = buildFixedParams(shared, fixedFieldValues);
    const representativeDistance = var1.type === 'distance' ? var1.start : fixedFieldValues.distance;
    shared.clubConf = computeClubConfLabel(shared, representativeDistance);

    setExportStatus('กำลังคำนวณ...');
    // Yield to the browser before the (potentially long) sweep so the
    // status text actually paints first.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const firstSweep = await runSweepOrientation(var1, var2, fixedParams, shared, includeSensitivity, '');
    const sweepCache = buildSweepCache(firstSweep, fixedParams);
    await applyHeightAdjustmentsToSweep(firstSweep, fixedParams, sweepCache, shared.dis, shared.aimX);
    const sweeps = [firstSweep];
    if (roundTrip)
        sweeps.push(await runCachedSweepOrientation(var2, var1, fixedParams, shared,
            sweepCache, 'Reverse Order'));
    if (roundTrip)
        await applyHeightAdjustmentsToSweep(sweeps[1], fixedParams, sweepCache, shared.dis, shared.aimX);

    const totalSuccess = sweeps.reduce((total, sweep) => total + sweep.success, 0);
    const totalFailure = sweeps.reduce((total, sweep) => total + sweep.failure, 0);

    setExportStatus('กำลังสร้างไฟล์ Excel...');
    await new Promise((resolve) => setTimeout(resolve, 0));

    buildAndDownloadWorkbook({ shared, fixedFieldValues, sweeps, totalSuccess, totalFailure });

    setExportStatus(`เสร็จสิ้น! (สำเร็จ ${totalSuccess} / ล้มเหลว ${totalFailure})`);
}

// -------------------------------------------------------------------------------------
// Workbook layout — mirrors the existing "Summary" + Note + table(s) sheet layout used
// by the reference exports (both the single-variable and the two-variable ones).
// -------------------------------------------------------------------------------------
const NOTE_LINES = [
    ['Height Pow Diff', 'Pow(y) change per 1m on current elevation.'],
    ['Height HWI Diff', 'HWI(pb) change per 1m on current elevation.'],
    ['Wind Pow Diff', 'Pow(y) change per 1m/s on current wind magnitude and angle.'],
    ['Wind HWI Diff', 'HWI(pb) change per 1m/s on current wind magnitude and angle.'],
    ['HWI Norm.', 'HWI(pb) normalized by effective 1m/s crosswind.'],
];

function fmt(n, digits) {
    if (n === null || n === undefined || Number.isNaN(n))
        return '-';
    return Number(n.toFixed(digits === undefined ? 4 : digits));
}

function decimalPlacesInInput(value) {
    const text = String(value == null ? '' : value).trim().toLowerCase();
    if (!text)
        return 0;

    const parts = text.split('e');
    const decimalPart = parts[0].split('.')[1] || '';
    const exponent = parts.length === 2 ? Number(parts[1]) || 0 : 0;
    return Math.max(0, decimalPart.length - exponent);
}

function hwiNorm(hwi, wind, degree) {
    const rad = degree * Math.PI / 180;
    const effectiveCrosswind = wind * Math.sin(rad);
    if (Math.abs(effectiveCrosswind) < 1e-6)
        return hwi;
    return hwi / effectiveCrosswind;
}

function buildAndDownloadWorkbook(ctx) {
    const { shared, fixedFieldValues, sweeps, totalSuccess, totalFailure } = ctx;
    const { var1, var2 } = sweeps[0];
    const aoa = [];

    aoa.push(['Summary', '']);
    aoa.push([]);
    aoa.push(['Mode:', 'Answer Finder']);
    aoa.push(['ClubConf:', shared.clubConf]);
    aoa.push(['ClubType:', shared.clubLabel]);
    aoa.push(['ShotType:', shared.shotLabel]);
    aoa.push(['PowerShot:', shared.psLabel]);
    aoa.push([]);

    // Fields shown in the summary block; 'ground' is intentionally omitted here to
    // match the reference exports, which never list it in the Summary section.
    const summaryFieldOrder = SWEEP_TYPE_ORDER.filter((t) => t !== 'ground');

    if (var2) {
        aoa.push(['Type', `${var1.def.label} and ${var2.def.label}`]);
        aoa.push([var1.def.summaryLabel + ':', `${var1.start} to ${var1.end}`]);
        aoa.push([var2.def.summaryLabel + ':', `${var2.start} to ${var2.end}`]);
        for (const type of summaryFieldOrder) {
            if (type === var1.type || type === var2.type)
                continue;
            aoa.push([SWEEP_FIELDS[type].summaryLabel + ':', String(fixedFieldValues[SWEEP_FIELDS[type].key])]);
        }
        aoa.push([]);
        aoa.push(['Freq1:', String(var1.freq)]);
        aoa.push(['Freq2:', String(var2.freq)]);
        aoa.push(['X Aim:', String(shared.aimX)]);
        aoa.push(['X HWI:', String(shared.dis)]);
        aoa.push([]);
    } else {
        aoa.push(['Type', var1.def.label]);
        aoa.push([var1.def.summaryLabel + ':', `${var1.start} to ${var1.end}`]);
        for (const type of summaryFieldOrder) {
            if (type === var1.type)
                continue;
            const label = SWEEP_FIELDS[type].summaryLabel;
            const value = fixedFieldValues[SWEEP_FIELDS[type].key];
            aoa.push([label + ':', String(value)]);
        }
        aoa.push([]);
        aoa.push(['Freq1:', String(var1.freq)]);
        aoa.push(['X Aim:', String(shared.aimX)]);
        aoa.push(['X HWI:', String(shared.dis)]);
        aoa.push([]);
    }

    aoa.push(['Steps:', String(totalSuccess + totalFailure)]);
    aoa.push(['Success:', String(totalSuccess)]);
    aoa.push(['Failure:', String(totalFailure)]);
    aoa.push([]);

    aoa.push(['Note!', '']);
    for (const [label, text] of NOTE_LINES)
        aoa.push([label, text]);
    aoa.push([]);

    const appendSweepTables = (sweep, isRoundTrip) => {
        const sweepVar1 = sweep.var1;
        const sweepVar2 = sweep.var2;
        const baseHeader = [sweepVar1.def.label, 'Pow (%)', 'Power'];
        const includeHeightAdjustments = true;
        const withBaseline = ['ΔPow'];
        const midHeader = ['Height Pow Diff', 'AIM', 'HWI'];
        const withBaselineHwi = ['ΔHWI'];
        const tailHeader = [
            'HWI Norm.',
            ...(includeHeightAdjustments ? ['HWI Adj'] : []),
            'Height HWI Diff',
            'Wind Pow Diff',
            'Wind HWI Diff',
        ];
        const hasBaseline = sweep.blocks.some((b) => b.rows.some((r) => r.deltaPow !== undefined));
        const header = [
            ...baseHeader,
            ...(hasBaseline ? withBaseline : []),
            ...(includeHeightAdjustments ? ['H'] : []),
            ...midHeader,
            ...(hasBaseline ? withBaselineHwi : []),
            ...tailHeader,
        ];

        if (isRoundTrip)
            aoa.push(['', `Reverse Order : ${sweepVar1.def.label} and ${sweepVar2.def.label}`]);

        for (const block of sweep.blocks) {
            if (block.label !== null) {
                const distance = (sweepVar1.type === 'distance' || sweepVar2.type === 'distance')
                    ? block.label
                    : fixedFieldValues.distance;
                const blockLabel = (sweepVar1.type === 'distance' || sweepVar2.type === 'distance')
                    ? `${sweepVar2.def.label} : ${block.label}`
                    : `${sweepVar2.def.label} : ${block.label}, Distance : ${distance}`;
                aoa.push(['', blockLabel]);
            } else if (sweepVar1.type !== 'distance') {
                aoa.push(['', `Distance : ${fixedFieldValues.distance}`]);
            }

            aoa.push(header);

            for (const row of block.rows) {
                if (!row.success) {
                    aoa.push([row.value, ...header.slice(1).map(() => '-')]);
                    continue;
                }
                const norm = row.hwiNorm !== undefined
                    ? row.hwiNorm
                    : hwiNorm(row.hwi, fixedFieldValues.wind, fixedFieldValues.degree);
                const line = [row.value, fmt(row.powPercent, 3), fmt(row.powYard, 3)];
                if (hasBaseline)
                    line.push(row.deltaPow !== undefined ? fmt(row.deltaPow, 3) : '-');
                if (includeHeightAdjustments)
                    line.push(row.h !== undefined && row.h !== null ? fmt(row.h, 4) : '-');
                line.push(fmt(row.heightPowDiff, 4), fmt(row.aim, 4), fmt(row.hwi, 4));
                if (hasBaseline)
                    line.push(row.deltaHwi !== undefined ? fmt(row.deltaHwi, 4) : '-');
                line.push(fmt(norm, 4));
                if (includeHeightAdjustments)
                    line.push(row.hwiAdj !== undefined && row.hwiAdj !== null ? fmt(row.hwiAdj, 4) : '-');
                line.push(fmt(row.heightHwiDiff, 4), fmt(row.windPowDiff, 4), fmt(row.windHwiDiff, 4));
                aoa.push(line);
            }
            aoa.push([]);
        }
    };

    appendSweepTables(sweeps[0], false);
    if (sweeps.length > 1)
        appendSweepTables(sweeps[1], true);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const styles = {
        title: {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'left', vertical: 'center' },
        },
        section: {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'left', vertical: 'center' },
        },
        label: { 
            font: { bold: true, sz: 11 },
        },
        summaryValue: {
            font: { sz: 11 },
            alignment: { horizontal: 'left', vertical: 'center' },
        },
        tableHeader: {
            font: { bold: true, sz: 8 },
            alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
        },
        blockLabel: {
            font: { sz: 11 },
            alignment: { vertical: 'center', horizontal: 'left' },
        },
        body: {
            font: { sz: 11 },
            alignment: { vertical: 'center', horizontal: 'right' },
        },
        note: {
            font: { sz: 11 },
            alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
        },
    };

    const applyStyle = (row, column, style) => {
        const cell = ws[XLSX.utils.encode_cell({ r: row - 1, c: column - 1 })];
        if (cell)
            cell.s = style;
    };

    const applyNumberFormat = (row, column, format) => {
        const cell = ws[XLSX.utils.encode_cell({ r: row - 1, c: column - 1 })];
        if (cell && typeof cell.v === 'number') {
            cell.z = format;
            cell.s = Object.assign({}, cell.s || {}, { numFmt: format });
        }
    };

    const applyRowStyle = (row, style) => {
        const values = aoa[row - 1] || [];
        for (let column = 1; column <= values.length; column++)
            applyStyle(row, column, style);
    };

    applyRowStyle(1, styles.title);

    let inNoteSection = false;
    let noteStartRow = -1;
    for (let row = 1; row <= aoa.length; row++) {
        const values = aoa[row - 1] || [];
        const first = values[0];

        if (first === 'Note!') {
            inNoteSection = true;
            noteStartRow = row;
            applyRowStyle(row, styles.section);
        } else if (inNoteSection && values.length) {
            applyRowStyle(row, styles.note);
        } else if (values.includes('Pow (%)')) {
            inNoteSection = false;
            applyRowStyle(row, styles.tableHeader);
        } else if (first === 'Type' || first === 'Type:') {
            inNoteSection = false;
            applyStyle(row, 1, styles.label);
            applyStyle(row, 2, styles.summaryValue);
        } else if (typeof first === 'string' && first.includes(' : ') && values.length === 1) {
            inNoteSection = false;
            applyStyle(row, 1, styles.blockLabel);
        } else if (typeof first === 'string' && first.endsWith(':')) {
            inNoteSection = false;
            applyStyle(row, 1, styles.label);
            if (values.length === 2 && first !== 'Range:')
                applyStyle(row, 2, styles.summaryValue);
        } else if (values.length > 0 && row > 1) {
            inNoteSection = false;
            applyRowStyle(row, styles.body);
        }
    }

    const totalColumns = Math.max(...aoa.map((row) => row.length), 1);
    const lastColumn = totalColumns - 1;

    // Apply the same header style across the complete worksheet width. Some
    // table variants have fewer populated header cells, so styling only the
    // row's data length makes their right edge look inconsistent.
    for (let row = 1; row <= aoa.length; row++) {
        if (!(aoa[row - 1] || []).includes('Pow (%)'))
            continue;

        for (let column = 1; column <= totalColumns; column++) {
            const address = XLSX.utils.encode_cell({ r: row - 1, c: column - 1 });
            if (!ws[address])
                ws[address] = { t: 's', v: '' };
            ws[address].s = {
                font: { bold: true, sz: 8 },
                alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
            };
        }
    }

    ws['!merges'] = [];

    ws['!merges'].push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: lastColumn },
    });

    const summaryStartRow = aoa.findIndex((row) => row[0] === 'Type' || row[0] === 'Type:') + 1;
    for (let row = 2; row < summaryStartRow; row++) {
        if (aoa[row - 1].length > 1 && aoa[row - 1][1] !== undefined && aoa[row - 1][1] !== '') {
            ws['!merges'].push({
                s: { r: row - 1, c: 1 },
                e: { r: row - 1, c: lastColumn },
            });
        }
    }

    if (summaryStartRow > 0 && noteStartRow >= 0) {
        for (let row = summaryStartRow; row < noteStartRow; row++) {
            if (aoa[row - 1].length > 1 && aoa[row - 1][1] !== undefined && aoa[row - 1][1] !== '') {
                ws['!merges'].push({
                    s: { r: row - 1, c: 1 },
                    e: { r: row - 1, c: lastColumn },
                });
            }
        }
    }

    if (noteStartRow >= 0) {
        for (let row = noteStartRow + 1; row <= aoa.length; row++) {
            if (!aoa[row - 1].length)
                break;
            ws['!merges'].push({
                s: { r: row - 1, c: 1 },
                e: { r: row - 1, c: lastColumn },
            });
        }
    }

    for (let row = 1; row <= aoa.length; row++) {
        const values = aoa[row - 1] || [];
        if (values.length === 2 && values[0] === '' && typeof values[1] === 'string') {
            ws['!merges'].push({
                s: { r: row - 1, c: 1 },
                e: { r: row - 1, c: lastColumn },
            });
        }
    }

    const tableHeaderRows = [];
    const var1Format = (decimals) => decimals > 0
        ? `0.${'0'.repeat(decimals)}`
        : '0';
    for (let row = 1; row <= aoa.length; row++) {
        if ((aoa[row - 1] || []).includes('Pow (%)'))
            tableHeaderRows.push(row);
    }

    for (const headerRow of tableHeaderRows) {
        const headerValues = aoa[headerRow - 1];
        const tableSweep = sweeps.find((sweep) => sweep.var1.def.label === headerValues[0]) || sweeps[0];
        for (let row = headerRow + 1; row <= aoa.length; row++) {
            const values = aoa[row - 1] || [];
            if (!values.length || values.includes('Pow (%)'))
                break;

            // A block label belongs to column B, but it sits
            // immediately above the table rows. Keep its dedicated style from
            // being overwritten by the numeric data-cell pass.
            if (values.length === 2 && values[0] === '' && typeof values[1] === 'string')
                continue;

            for (let column = 1; column <= headerValues.length; column++) {
                const cell = ws[XLSX.utils.encode_cell({ r: row - 1, c: column - 1 })];
                if (!cell)
                    continue;

                cell.s = Object.assign({}, cell.s || {}, {
                    alignment: Object.assign({}, cell.s && cell.s.alignment || {}, {
                        horizontal: 'right',
                        vertical: 'center',
                    }),
                });

                const header = headerValues[column - 1];
                const format = column === 1
                    ? var1Format(tableSweep.var1.decimals)
                    : header === 'Pow (%)' || header === 'Power' || header === 'ΔPow'
                    ? '0.000'
                    : '0.0000';
                applyNumberFormat(row, column, format);
            }
        }
    }

    // Reapply block-label styling after all table formatting has completed so
    // rows such as "Wind : 5" always use their own style in column B.
    for (let row = 1; row <= aoa.length; row++) {
        const values = aoa[row - 1] || [];
        if (values.length === 2 && values[0] === '' && typeof values[1] === 'string')
            applyStyle(row, 2, styles.blockLabel);
    }

    // Match the compact reference sheet: column A is wider, all data columns
    // use one shared width.
    ws['!cols'] = [
        { wch: 13 },
        ...Array.from({ length: Math.max(totalColumns - 1, 0) }, () => ({ wch: 10 })),
    ];
    ws['!rows'] = [{ hpt: 14 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Answers');

    const stamp = Date.now();
    XLSX.writeFile(wb, `pangya_export_${stamp}.xlsx`);
}

function calcMycella(el) {

    const align_degree = checkValidInput(document.querySelector('#mycella>#align-degree').value);
    const px = checkValidInput(document.querySelector('#mycella>#px').value);
    const slope_side = checkValidInput(document.querySelector('#mycella>#slope-side').value);
    const x_slope = checkValidInput(document.querySelector('#mycella>#x-slope').value);

    const slope_real = Math.abs((Math.cos(Math.abs(Math.PI  / 180 * (align_degree)))) * (px / 30.7));

    document.getElementById('slopebreak').value = ((slope_real * x_slope) * slope_side).toFixed(4);
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

    document.getElementById('winddeg').value = angle360.toFixed(4);

}

function anglecalc2(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 180 - angle90;

    document.getElementById('winddeg').value = angle360.toFixed(4);

}

function anglecalc3(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 180 + angle90;

    document.getElementById('winddeg').value = angle360.toFixed(4);

}

function anglecalc4(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 360 - angle90;

    document.getElementById('winddeg').value = angle360.toFixed(4);

}
