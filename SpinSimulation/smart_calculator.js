// Arquivo smart_calculator.js
// Criado em 31/08/2020 as 18:21 por Acrisio
// Algoritmo que calcula o lançamento obliquo com resistência do meio e o efeito magnus.
// Obtido atraves de engenharia reversa do pangya.

const DESVIO_SCALE_PANGYA_TO_YARD = 0.3125 / 1.5;
const QUADTREE_GRAVITY = 34.295296;

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
        this.ball.position.y += this.ball.diametro / 2;

        // Usa no Cobra
        this.ball_position_init = this.ball.position.clone();

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
            return retVect;
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

function simulate_shot(power_player, club_info, shot, power_shot, altura, vento, angulo, terreno, spin, curva, slope, percentShot, bound, roll, afterBurnerEnabled = true, rainWeather = false) {

    const simulate = (distanceEstimate) => {
        const altura_colision_raw = altura * 1.094 * 3.2;
        const isRain = rainWeather;
        const weatherBounceCoefficient = isRain ? 0.9 : 1;
        const bounceCoefficient = weatherBounceCoefficient * bound;
        const effectiveRoll = roll * (isRain ? 1.13 : 1);
        const vball = new Ball();
        const vclub = club;
        const wind = new Wind();

        // The engine tracks the ball's center (position.y), but a shot should be considered
        // to have reached the target's elevation once the ball's *lower edge* touches it, not
        // its center. Offsetting the threshold upward by the ball's radius makes the center-based
        // crossing check equivalent to a lower-bound (bottom of hitbox) crossing check.
        const ball_radius = vball.diametro / 2;
        const altura_colision = altura_colision_raw + ball_radius;

        if (club != undefined)
            vclub.init(club_info);

        const slope_mira_rad = slope instanceof Vector3D
            ? slope.y
            : 0.0;

        if (club != undefined)
            vclub.type_distance = calculeTypeDistance(distanceEstimate);

        if (slope instanceof Vector3D) {
            vball.slope = slope.clone();
            vball.slope.y = 1.0;
        } else if (!isNaN(slope)) {
            vball.slope = new Vector3D(slope * slope_break_to_curve_slope * -1, 1.0, 0.0);
        }

        wind.wind = vento;
        wind.degree = angulo;

        const options = {
            distance: distanceEstimate,
            percentShot: percentShot,
            ground: terreno,
            mira_rad: 0.0,
            slope_mira_rad: slope_mira_rad,
            spin: spin / 30,
            curva: curva / 30,
            position: new Vector3D(0.0, 0.0, 0.0),
            shot: shot,
            ps: power_shot,
            power: power_player
        };

        const qt = new QuadTree();
        qt.initShot(vball, vclub, wind, options);
        const afterBurnerLaunchVelocity = vball.velocity.clone();

        let count = 0;
        const previousBall = new Ball();
        const trajectory = [{ x: vball.position.x, y: vball.position.y, z: vball.position.z }];
        const bouncePoints = [];
        const limit_checking = 100000; // safety cap so a shot that never crosses altura_colision can't loop forever

        let landingPoint = null;
        let cobraBeforeRisePoint = null;
        while (count++ < limit_checking) {
            previousBall.copy(vball);
            const cobraWasInitialized = qt.cobra_init >= 0;
            qt.ballProcess(_00D083A0);
            if (!cobraWasInitialized && qt.cobra_init >= 0) {
                cobraBeforeRisePoint = {
                    x: vball.position.x,
                    y: vball.position.y,
                    z: vball.position.z
                };
            }
            trajectory.push({ x: vball.position.x, y: vball.position.y, z: vball.position.z });

            if (vball.num_max_height < 0)
                continue;

            const previousHeight = previousBall.position.y;
            const currentHeight = vball.position.y;
            if (previousHeight >= altura_colision && currentHeight <= altura_colision &&
                previousHeight !== currentHeight) {
                const fraction = (previousHeight - altura_colision) / (previousHeight - currentHeight);
                landingPoint = {
                    x: previousBall.position.x + (vball.position.x - previousBall.position.x) * fraction,
                    y: altura_colision,
                    z: previousBall.position.z + (vball.position.z - previousBall.position.z) * fraction
                };
                break;
            }

            if (currentHeight < altura_colision)
                return null;
        }

        if (!landingPoint)
            return null;

        trajectory[trajectory.length - 1] = landingPoint;
        vball.position.x = landingPoint.x;
        vball.position.y = landingPoint.y;
        vball.position.z = landingPoint.z;

        const carryZ = vball.position.z;
        const carryX = vball.position.x;
        const impactVelocity = vball.velocity.clone();
        const initialSpin = vball.spin;
        const initialShotPower = qt.power_factor;
        const backspinAfterBounce = afterBurnerEnabled && initialSpin > 0;
        const frontspinAfterRoll = afterBurnerEnabled && initialSpin < 0;
        const usesCarryAfterBurner = afterBurnerEnabled &&
            (shot == SHOT_TYPE.TOMAHAWK || shot == SHOT_TYPE.SPIKE);
        let afterBurnerPending = usesCarryAfterBurner;
        let afterBurnerTriggered = false;
        let afterBurnerStartX = carryX;
        let afterBurnerStartZ = carryZ;
        let bounceCount = 0;

        const applyFlatGroundBounceResponse = (incomingVelocity) => {
            vball.rotation_spin = Math.min(vball.rotation_spin, 0);
            const spinFactor = initialSpin * 0.1 + 0.3;
            const normal = new Vector3D(0, 1, 0);
            const perpendicular = normal.clone().multiplyScalar(
                -(normal.x * incomingVelocity.x +
                    normal.y * incomingVelocity.y +
                    normal.z * incomingVelocity.z)
            );
            const parallel = incomingVelocity.clone().add(perpendicular);
            const bounce = perpendicular.clone().multiplyScalar(bounceCoefficient);
            const keep = 1 - (1 - bounceCoefficient) * spinFactor;

            vball.velocity = parallel.multiplyScalar(keep).add(bounce);
        };

        const advancePangyaMotion = (step, grounded) => {
            const force = grounded
                ? new Vector3D(0, 0, 0)
                : qt.applyForce();
            const previousVelocityX = vball.velocity.x;
            const previousVelocityZ = vball.velocity.z;

            if (grounded) {
                const groundSpeed = Math.hypot(vball.velocity.x, vball.velocity.z);
                const frictionMagnitude = QUADTREE_GRAVITY * effectiveRoll * vball.mass;
                if (groundSpeed > 0)
                    force.add(vball.velocity.clone().multiplyScalar(-frictionMagnitude / groundSpeed));
            }

            vball.velocity.add(force.divideScalar(vball.mass).multiplyScalar(step));
            if (!grounded && vball.num_max_height == -1) {
                const extraForce = qt._21D8_vect.clone().divideScalar(vball.mass).multiplyScalar(step);
                vball.velocity.add(extraForce);
            }
            if (grounded && previousVelocityX * vball.velocity.x + previousVelocityZ * vball.velocity.z <= 0) {
                vball.velocity.x = 0;
                vball.velocity.z = 0;
            }
            if (grounded) {
                const previousPosition = vball.position.clone();
                vball.position.add(vball.velocity.clone().multiplyScalar(step));
                vball.ball_30 -= vball.position.clone().sub(previousPosition).length() / ball_radius * 0.3;
            } else {
                vball.ball_2C += vball.rotation_curve * _00D1A888 * step;
                vball.ball_30 += vball.rotation_spin * _00D3D210 * step;
            }
        };

        const triggerAfterBurner = () => {
            afterBurnerStartX = vball.position.x;
            afterBurnerStartZ = vball.position.z;
            const inversePower = initialShotPower !== 0 ? 1 / initialShotPower : 0;
            const scale = initialSpin * -40;
            vball.velocity.x = afterBurnerLaunchVelocity.x * scale * inversePower;
            vball.velocity.y = 0;
            vball.velocity.z = afterBurnerLaunchVelocity.z * scale * inversePower;
            vball.spin = initialSpin * 1.5;

            for (let frame = 0; frame < 50; frame++)
                vball.ball_30 += initialSpin * 62.831856 * _00D083A0;

            afterBurnerTriggered = true;
        };

        // Tomahawk and Spike suppress the flat-ground bounce and trigger at carry end.
        qt.cobra_init = 0;
        qt.spike_init = 0;
        vball.position.y = landingPoint.y;
        vball.curva = 0;
        vball.rotation_curve = 0;

        let bounceSteps = 0;
        let transitionedToRoll = false;
        let groundContact = true;
        let previousBounceZ = carryZ;
        let snapStartX = carryX;
        let snapStartZ = carryZ;
        let snapDistance = 0;
        let snapPoint = null;
        const bounceDistances = [];
        if (usesCarryAfterBurner) {
            vball.velocity = new Vector3D(0, 0, 0);
            triggerAfterBurner();
            transitionedToRoll = true;
        } else {
            vball.velocity = impactVelocity.clone();
            applyFlatGroundBounceResponse(impactVelocity);

            while (bounceSteps < 10000) {
                advancePangyaMotion(_00D083A0, false);
                const move = vball.velocity.clone().multiplyScalar(_00D083A0);
                if (groundContact && vball.velocity.y < 0) {
                    vball.position.x += move.x;
                    vball.position.z += move.z;
                    snapDistance = (vball.position.z - snapStartZ) / 3.2;
                    vball.velocity.y = 0;
                    vball.position.y = landingPoint.y;
                    snapPoint = {
                        x: vball.position.x,
                        y: vball.position.y,
                        z: vball.position.z
                    };
                    transitionedToRoll = true;
                    afterBurnerPending = backspinAfterBounce;
                    trajectory.push({
                        x: vball.position.x,
                        y: vball.position.y,
                        z: vball.position.z
                    });
                    break;
                }

                if (move.y < 0 && vball.position.y + move.y <= landingPoint.y) {
                    const impactFraction = Math.min(1, Math.max(0,
                        (landingPoint.y - vball.position.y) / move.y));
                    vball.position.x += move.x * impactFraction;
                    vball.position.z += move.z * impactFraction;
                    vball.position.y = landingPoint.y;
                    bouncePoints.push({
                        x: vball.position.x,
                        y: vball.position.y,
                        z: vball.position.z
                    });
                    bounceDistances.push((vball.position.z - previousBounceZ) / 3.2);
                    previousBounceZ = vball.position.z;
                    snapStartX = vball.position.x;
                    snapStartZ = vball.position.z;
                    bounceCount++;
                    applyFlatGroundBounceResponse(vball.velocity.clone());
                    groundContact = true;
                } else {
                    vball.position.add(move);
                    groundContact = false;
                }

                bounceSteps++;
                trajectory.push({ x: vball.position.x, y: vball.position.y, z: vball.position.z });
            }
        }

        if (!transitionedToRoll) {
            vball.position.y = landingPoint.y;
            vball.velocity.x = 0;
            vball.velocity.y = 0;
            vball.velocity.z = 0;
        }

        const bounceEndX = vball.position.x;
        const bounceEndZ = vball.position.z;
        const bounceDistance = bounceDistances.reduce(
            (total, distance) => total + distance,
            snapDistance
        );
        let rolloutEndX = bounceEndX;
        let rolloutEndZ = bounceEndZ;
        const rollStopSpeed = QUADTREE_GRAVITY * effectiveRoll * _00D083A0;
        const rollUntilStop = () => {
            let steps = 0;
            while (steps < 10000) {
                const groundSpeed = Math.hypot(vball.velocity.x, vball.velocity.z);
                if (groundSpeed < rollStopSpeed) {
                    vball.velocity.x = 0;
                    vball.velocity.y = 0;
                    vball.velocity.z = 0;
                    break;
                }
                advancePangyaMotion(_00D083A0, true);
                vball.position.y = landingPoint.y;
                steps++;
                trajectory.push({ x: vball.position.x, y: landingPoint.y, z: vball.position.z });
            }

            return steps;
        };

        let rollSteps = 0;
        if (!afterBurnerTriggered && afterBurnerPending) {
            triggerAfterBurner();
        } else {
            rollSteps += rollUntilStop();
            rolloutEndX = vball.position.x;
            rolloutEndZ = vball.position.z;
            if (!afterBurnerTriggered && frontspinAfterRoll &&
                afterBurnerEnabled &&
                (shot == SHOT_TYPE.DUNK || shot == SHOT_TYPE.COBRA)) {
                triggerAfterBurner();
            }
        }

        if (afterBurnerTriggered)
            rollSteps += rollUntilStop();

        const lastTrajectoryPoint = trajectory[trajectory.length - 1];
        if (lastTrajectoryPoint.x !== vball.position.x ||
            lastTrajectoryPoint.y !== vball.position.y ||
            lastTrajectoryPoint.z !== vball.position.z)
            trajectory.push({ x: vball.position.x, y: vball.position.y, z: vball.position.z });

        const rolloutDistance = (rolloutEndZ - bounceEndZ) / 3.2;
        const afterBurnerDistance = afterBurnerTriggered
            ? (vball.position.z - afterBurnerStartZ) / 3.2
            : 0;

        return {
            z: carryZ,
            x: carryX,
            bounceEndX: bounceEndX,
            bounceEndZ: bounceEndZ,
            rolloutEndX: rolloutEndX,
            rolloutEndZ: rolloutEndZ,
            afterBurnerTriggered: afterBurnerTriggered,
            afterBurnerStartX: afterBurnerStartX,
            afterBurnerStartZ: afterBurnerStartZ,
            snapDistance: snapDistance,
            snapStartX: snapStartX,
            snapStartZ: snapStartZ,
            snapPoint: snapPoint,
            cobraBeforeRisePoint: cobraBeforeRisePoint,
            finalX: vball.position.x,
            finalZ: vball.position.z,
            trajectory: trajectory,
            carryPoint: { x: carryX, y: landingPoint.y, z: carryZ },
            bouncePoints: bouncePoints,
            bounceCount: bounceCount,
            bounceDistances: bounceDistances,
            bounceDistance: bounceDistance,
            rolloutDistance: rolloutDistance,
            afterBurnerDistance: afterBurnerDistance,
            totalRunDistance: bounceDistance + rolloutDistance + afterBurnerDistance
        };
    };

    const firstEstimate = 58.0;
    const resultA = simulate(firstEstimate);
    if (!resultA)
        return { distance: -1, desvio: 0, pb: 0, trajectory: [], bouncePoints: [], bounceCount: 0, bounceDistances: [], bounceDistance: 0, rolloutDistance: 0, totalRunDistance: 0 };

    const distanceYards = resultA.z / 3.2;
    const typeDistance = calculeTypeDistance(distanceYards);

    if (typeDistance === calculeTypeDistance(firstEstimate)) {
        const desvioYards = resultA.x * DESVIO_SCALE_PANGYA_TO_YARD;
        return {
            distance: distanceYards,
            desvio: desvioYards,
            pb: desvioByDegree(desvioYards, distanceYards) / YARDS_TO_PB,
            bounceEndX: resultA.bounceEndX,
            bounceEndZ: resultA.bounceEndZ,
            rolloutEndX: resultA.rolloutEndX,
            rolloutEndZ: resultA.rolloutEndZ,
            afterBurnerTriggered: resultA.afterBurnerTriggered,
            afterBurnerStartX: resultA.afterBurnerStartX,
            afterBurnerStartZ: resultA.afterBurnerStartZ,
            snapDistance: resultA.snapDistance,
            snapStartX: resultA.snapStartX,
            snapStartZ: resultA.snapStartZ,
            snapPoint: resultA.snapPoint,
            cobraBeforeRisePoint: resultA.cobraBeforeRisePoint,
            finalX: resultA.finalX,
            finalZ: resultA.finalZ,
            trajectory: resultA.trajectory,
            carryPoint: resultA.carryPoint,
            bouncePoints: resultA.bouncePoints,
            bounceCount: resultA.bounceCount,
            bounceDistances: resultA.bounceDistances,
            bounceDistance: resultA.bounceDistance,
            rolloutDistance: resultA.rolloutDistance,
            afterBurnerDistance: resultA.afterBurnerDistance,
            totalRunDistance: resultA.totalRunDistance
        };
    }

    const resultB = simulate(distanceYards);
    if (!resultB)
        return {
            distance: distanceYards,
            desvio: resultA.x * DESVIO_SCALE_PANGYA_TO_YARD,
            pb: (resultA.x * DESVIO_SCALE_PANGYA_TO_YARD) / YARDS_TO_PB,
            bounceEndX: resultA.bounceEndX,
            bounceEndZ: resultA.bounceEndZ,
            rolloutEndX: resultA.rolloutEndX,
            rolloutEndZ: resultA.rolloutEndZ,
            afterBurnerTriggered: resultA.afterBurnerTriggered,
            afterBurnerStartX: resultA.afterBurnerStartX,
            afterBurnerStartZ: resultA.afterBurnerStartZ,
            snapDistance: resultA.snapDistance,
            snapStartX: resultA.snapStartX,
            snapStartZ: resultA.snapStartZ,
            snapPoint: resultA.snapPoint,
            cobraBeforeRisePoint: resultA.cobraBeforeRisePoint,
            finalX: resultA.finalX,
            finalZ: resultA.finalZ,
            trajectory: resultA.trajectory,
            carryPoint: resultA.carryPoint,
            bouncePoints: resultA.bouncePoints,
            bounceCount: resultA.bounceCount,
            bounceDistances: resultA.bounceDistances,
            bounceDistance: resultA.bounceDistance,
            rolloutDistance: resultA.rolloutDistance,
            afterBurnerDistance: resultA.afterBurnerDistance,
            totalRunDistance: resultA.totalRunDistance
        };

    const desvioYards = resultB.x * DESVIO_SCALE_PANGYA_TO_YARD;
    const finalDistanceYards = resultB.z / 3.2;

    return {
        distance: finalDistanceYards,
        desvio: desvioYards,
        pb: desvioByDegree(desvioYards, finalDistanceYards) / YARDS_TO_PB,
        bounceEndX: resultB.bounceEndX,
        bounceEndZ: resultB.bounceEndZ,
        rolloutEndX: resultB.rolloutEndX,
        rolloutEndZ: resultB.rolloutEndZ,
        afterBurnerTriggered: resultB.afterBurnerTriggered,
        afterBurnerStartX: resultB.afterBurnerStartX,
        afterBurnerStartZ: resultB.afterBurnerStartZ,
        snapDistance: resultB.snapDistance,
        snapStartX: resultB.snapStartX,
        snapStartZ: resultB.snapStartZ,
        snapPoint: resultB.snapPoint,
        cobraBeforeRisePoint: resultB.cobraBeforeRisePoint,
        finalX: resultB.finalX,
        finalZ: resultB.finalZ,
        trajectory: resultB.trajectory,
        carryPoint: resultB.carryPoint,
        bouncePoints: resultB.bouncePoints,
        bounceCount: resultB.bounceCount,
        bounceDistances: resultB.bounceDistances,
        bounceDistance: resultB.bounceDistance,
        rolloutDistance: resultB.rolloutDistance,
        afterBurnerDistance: resultB.afterBurnerDistance,
        totalRunDistance: resultB.totalRunDistance
    };
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

    let power_used = checkValidInput(document.getElementById('power_used').value);
    let height = checkValidInput(document.getElementById('height').value);
    let wind = checkValidInput(document.getElementById('wind').value);
    let degree = checkValidInput(document.getElementById('degree').value);
    let ground = checkValidInput(document.getElementById('ground').value)
    let bound = checkValidInput(document.getElementById('bound').value);
    let roll = checkValidInput(document.getElementById('roll').value);
    let afterBurnerEnabled = document.getElementById('afterburner').checked;
    let rainWeather = document.getElementById('rain-weather').checked;
    let spin = checkValidInput(document.getElementById('spin').value);
    let curve = checkValidInput(document.getElementById('curve').value);
    let slope_break = checkValidInputSlope(document.getElementById('slope_break').value);
    let dis = checkValidInput(document.getElementById('dis').value);
    let aim = checkValidInput(document.getElementById('aim').value);

    let power_percent = 0.0;

    // Convert input in yards into a normalized power percent using the selected club range
    const tempClub = new Club();
    tempClub.init(club);
    tempClub.type_distance = calculeTypeDistance(power_used);
    const club_range = tempClub.getRange({
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
    }, power, power_shot);

    if (club_range > 0)
        power_percent = power_used / club_range;

    let result = document.getElementById('result');

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
        height: height,
        wind: wind,
        degree: degree,
        ground: ground,
        spin: spin,
        curva: curve,
        slope: slope_break
    };

    // Calc
    const simulation = simulate_shot(
        input_values.power_player,
        input_values.club_info,
        input_values.shot,
        input_values.power_shot,
        input_values.height,
        input_values.wind,
        input_values.degree,
        input_values.ground,
        input_values.spin,
        input_values.curva,
        input_values.slope,
        power_percent,
        bound,
        roll,
        afterBurnerEnabled,
        rainWeather
    );

    if (simulation.distance >= 0) {
        drawTrajectory(
            simulation.trajectory,
            simulation.bouncePoints,
            height,
            dis,
            simulation.distance + simulation.totalRunDistance,
            simulation.carryPoint,
            simulation.snapPoint,
            simulation.cobraBeforeRisePoint
        );
        result.color = 'Green';
        const hwiFor = (desvioYards, distanceYards) =>
            desvioByDegree(desvioYards, distanceYards) / YARDS_TO_PB * dis;
        const hwiChange = (startX, startZ, endX, endZ) =>
            hwiFor(endX, endZ) - hwiFor(startX, startZ);
        const displayedHwiValue = (hwi) => Number(hwi.toFixed(4));
        const aimFor = (hwi) => aim === 0 ? 'n/a' : (hwi / aim).toFixed(4);
        const carryX = simulation.desvio;
        const carryZ = simulation.distance;
        const bounceEndX = simulation.bounceEndX * DESVIO_SCALE_PANGYA_TO_YARD;
        const bounceEndZ = simulation.bounceEndZ / 3.2;
        const rolloutEndX = simulation.rolloutEndX * DESVIO_SCALE_PANGYA_TO_YARD;
        const rolloutEndZ = simulation.rolloutEndZ / 3.2;
        const finalX = simulation.finalX * DESVIO_SCALE_PANGYA_TO_YARD;
        const finalZ = simulation.finalZ / 3.2;
        const snapStartX = simulation.snapStartX * DESVIO_SCALE_PANGYA_TO_YARD;
        const snapStartZ = simulation.snapStartZ / 3.2;
        const hwiBounce = hwiChange(carryX, carryZ, bounceEndX, bounceEndZ);
        const hwiSnap = hwiChange(snapStartX, snapStartZ, bounceEndX, bounceEndZ);
        const hwiRollout = hwiChange(bounceEndX, bounceEndZ, rolloutEndX, rolloutEndZ);
        const hwiCarryBounce = hwiFor(
            bounceEndX,
            bounceEndZ
        );
        const hwiCarryBounceRollout = hwiFor(
            finalX,
            finalZ
        );
        const hwiAfterBurner = simulation.afterBurnerTriggered
            ? hwiChange(rolloutEndX, rolloutEndZ, finalX, finalZ)
            : 0;
        const hwiRun = Number((
            displayedHwiValue(hwiBounce) +
            displayedHwiValue(hwiRollout) +
            displayedHwiValue(hwiAfterBurner)
        ).toFixed(4));
        // Snap is shown as a breakdown of Bounce, so Run must not add it twice.
        const stageMetrics = [
            { name: 'Bounce', distance: simulation.bounceDistance, hwi: hwiBounce },
            { name: 'Snap', distance: simulation.snapDistance, hwi: hwiSnap },
            { name: 'Rollout', distance: simulation.rolloutDistance, hwi: hwiRollout }
        ];
        if (simulation.afterBurnerTriggered)
            stageMetrics.push({
                name: 'Afterburner',
                distance: simulation.afterBurnerDistance,
                hwi: hwiAfterBurner
            });
        stageMetrics.push({
            name: 'Run',
            distance: simulation.totalRunDistance,
            hwi: hwiRun
        });

        const nonZeroStages = stageMetrics.filter((stage) => Math.abs(stage.distance) >= 0.0005);
        const stageDistanceLines = nonZeroStages.map((stage) => `
        <text style="color:Pink"><text style="font-size:16px">
            ${stage.name} Distance : ${stage.distance.toFixed(3)}y
        </text><br>`).join('');
        const stageHwiLines = nonZeroStages.map((stage) => `
        <text style="color:Pink"><text style="font-size:16px">
            HWI (${stage.name}) : ${stage.hwi.toFixed(4)} pb
        </text><br>`).join('');
        const stageAimLines = nonZeroStages.map((stage) => `
        <text style="color:Pink"><text style="font-size:16px">
            AIM (${stage.name}) : ${aimFor(stage.hwi)} aim
        </text><br>`).join('');
        let previousBounceX = carryX;
        let previousBounceZ = carryZ;
        const bounceDetails = simulation.bouncePoints.map((point, index) => {
            const distance = simulation.bounceDistances[index];
            const pointX = point.x * DESVIO_SCALE_PANGYA_TO_YARD;
            const pointZ = point.z / 3.2;
            const hwi = hwiChange(
                previousBounceX,
                previousBounceZ,
                pointX,
                pointZ
            );
            previousBounceX = pointX;
            previousBounceZ = pointZ;
            return {
                number: index + 1,
                label: `Bounce ${index + 1}`,
                distance: distance,
                hwi: hwi
            };
        });
        const bounceDistanceLines = bounceDetails
            .map((bounce) => `
        <text style="color:Pink"><text style="font-size:16px">
            ${bounce.label} Distance : ${bounce.distance.toFixed(3)}y
        </text><br>`)
            .join('');
        const bounceHwiLines = bounceDetails
            .map((bounce) => `
        <text style="color:Pink"><text style="font-size:16px">
            HWI (${bounce.label}) : ${bounce.hwi.toFixed(4)} pb
        </text><br>`)
            .join('');
        const bounceAimLines = bounceDetails
            .map((bounce) => `
        <text style="color:Pink"><text style="font-size:16px">
            AIM (${bounce.label}) : ${aimFor(bounce.hwi)} aim
        </text><br>`)
            .join('');
        result.innerHTML = `
        <b><text style="color:Pink"><text style="font-size:18px">General Data</text></b><br>
        <text style="color:Pink"><text style="font-size:16px">
            Carry Distance : ${simulation.distance.toFixed(3)}y
        </text><br>
        <text style="color:Pink"><text style="font-size:16px">
            Carry + Bounce Distance : ${(simulation.distance + simulation.bounceDistance).toFixed(3)}y
        </text><br>
        <text style="color:Pink"><text style="font-size:16px">
            Carry + Run Distance : ${(simulation.distance + simulation.totalRunDistance).toFixed(3)}y
        </text><br><br>
        ${stageDistanceLines}
        <br>
        <text style="color:Pink"><text style="font-size:16px">
            Bounces : ${simulation.bounceCount}
        </text><br>
        ${bounceDistanceLines}
        <br>

        <b><text style="color:Pink"><text style="font-size:18px">HWI</text></b><br>
        <text style="color:Pink"><text style="font-size:16px">
            HWI (Carry) : ${(simulation.pb * dis).toFixed(4)} pb
        </text><br>
        <text style="color:Pink"><text style="font-size:16px">
            HWI (Carry+Bounce) : ${hwiCarryBounce.toFixed(4)} pb
        </text><br>
        <text style="color:Pink"><text style="font-size:16px">
            HWI (Carry+Run) : ${hwiCarryBounceRollout.toFixed(4)} pb
        </text><br>
        <br>
        ${stageHwiLines}
        <br>
        <text style="color:Pink"><text style="font-size:16px">
            Bounces : ${simulation.bounceCount}
        </text><br>
        ${bounceHwiLines}
        <br>

        <b><text style="color:Pink"><text style="font-size:18px">AIM</text></b><br>
        <text style="color:Pink"><text style="font-size:16px">
            AIM (Carry) : ${aimFor(simulation.pb * dis)} aim
        </text><br>
        <text style="color:Pink"><text style="font-size:16px">
            AIM (Carry+Bounce) : ${aimFor(hwiCarryBounce)} aim
        </text><br>
        <text style="color:Pink"><text style="font-size:16px">
            AIM (Carry+Run) : ${aimFor(hwiCarryBounceRollout)} aim
        </text><br>
        <br>
        ${stageAimLines}
        <br>
        <text style="color:Pink"><text style="font-size:16px">
            Bounces : ${simulation.bounceCount}
        </text><br>
        ${bounceAimLines}`;
    } else {
        drawTrajectory([], []);
        result.color = 'Pink';
        result.innerHTML = 'ไม่สามารถจำลองการตีได้ ลองตรวจสอบค่าที่ป้อน';
    }
}

const trajectoryZoom = {
    lateral: { x: 1, y: 1 },
    height: { x: 1, y: 1 }
};
const trajectoryPan = {
    lateral: { x: 0, y: 0 },
    height: { x: 0, y: 0 }
};
let trajectoryPlotRanges = {};
let activeTrajectoryPan = null;
let activeTrajectoryZoom = null;
let trajectoryHover = null;
let lastTrajectory = [];
let lastBouncePoints = [];
let lastCarryPoint = null;
let lastSnapPoint = null;
let lastCobraBeforeRisePoint = null;
let lastTerrainHeightMeters = 0;
let lastCarryRunDistanceYards = 0;
let lastLateralScaleToPb = 1;

function drawTrajectory(trajectory, bouncePoints, terrainHeightMeters = 0, displayScale = 1, carryRunDistanceYards = 0, carryPoint = null, snapPoint = null, cobraBeforeRisePoint = null) {
    lastTrajectory = trajectory;
    lastBouncePoints = bouncePoints;
    lastCarryPoint = carryPoint;
    lastSnapPoint = snapPoint;
    lastCobraBeforeRisePoint = cobraBeforeRisePoint;
    trajectoryHover = null;
    lastTerrainHeightMeters = terrainHeightMeters;
    lastCarryRunDistanceYards = carryRunDistanceYards;
    lastLateralScaleToPb = displayScale / YARDS_TO_PB;
    trajectoryPan.lateral.x = 0;
    trajectoryPan.lateral.y = 0;
    trajectoryPan.height.x = 0;
    trajectoryPan.height.y = 0;
    renderTrajectory();
}

function renderTrajectory() {
    const canvas = document.getElementById('trajectory');
    const context = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (width === 0 || height === 0)
        return;

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = 'rgb(44, 0, 68)';
    context.fillRect(0, 0, width, height);
    context.font = '12px sans-serif';
    context.fillStyle = 'pink';

    if (lastTrajectory.length < 2) {
        context.fillText('Calculate a shot to view its simulated path.', 16, 26);
        return;
    }

    const narrowLayout = width < 760;
    const panelGap = 24;
    const panelWidth = narrowLayout ? width : (width - panelGap) / 2;
    const panelHeight = narrowLayout ? (height - panelGap) / 2 : height;
    const panels = narrowLayout
        ? [
            { x: 0, y: 0, width: panelWidth, height: panelHeight },
            { x: 0, y: panelHeight + panelGap, width: panelWidth, height: panelHeight }
        ]
        : [
            { x: 0, y: 0, width: panelWidth, height: height },
            { x: panelWidth + panelGap, y: 0, width: panelWidth, height: height }
        ];

    const heightUnitToMeters = 1 / (3.2 * 1.094);
    const golfRadiusInternal = new Ball().diametro / 2;
    const golfRadiusMeters = golfRadiusInternal * heightUnitToMeters;
    const values = {
        lateral: lastTrajectory.map(point =>
            point.x * DESVIO_SCALE_PANGYA_TO_YARD * lastLateralScaleToPb
        ),
        distance: lastTrajectory.map(point => point.z / 3.2),
        height: lastTrajectory.map(point => point.y * heightUnitToMeters)
    };
    const bounds = (items, zoom, symmetric = false) => {
        let min = Math.min(0, ...items);
        let max = Math.max(0, ...items);
        const extent = Math.max(max - min, 1);
        if (symmetric) {
            const halfRange = Math.max(Math.abs(min), Math.abs(max), 0.5) * 1.08 / zoom;
            return { min: -halfRange, max: halfRange };
        }

        const padding = extent * 0.08;
        min -= padding;
        max += padding;
        const center = (min + max) / 2;
        const halfRange = (max - min) / (2 * zoom);
        min = center - halfRange;
        max = center + halfRange;
        return { min, max };
    };
    const niceStep = (range, targetTicks) => {
        const rough = (range.max - range.min) / targetTicks;
        const power = Math.pow(10, Math.floor(Math.log10(rough)));
        const fraction = rough / power;
        const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
        return niceFraction * power;
    };
    const tickValues = (range) => {
        const step = niceStep(range, 5);
        const ticks = [];
        for (let value = Math.ceil(range.min / step) * step;
            value <= range.max + step * 1e-8;
            value += step) {
            ticks.push(Math.abs(value) < step * 1e-8 ? 0 : value);
        }
        return { ticks, step };
    };
    const formatTick = (value, step) => {
        const decimals = Math.max(0, Math.min(3, -Math.floor(Math.log10(step))));
        return value.toFixed(decimals);
    };
    trajectoryPlotRanges = {};
    const drawPanel = (panel, panelId, title, xLabel, yLabel, xValues, yValues, xSymmetric, pathColor, pathPoints, markerPoints, startLabel = '', referenceLineValue = null) => {
        const left = panel.x + 48;
        const right = panel.x + panel.width - 14;
        const top = panel.y + 38;
        const bottom = panel.y + panel.height - 38;
        const plotWidth = right - left;
        const plotHeight = bottom - top;
        const xRange = bounds(xValues, trajectoryZoom[panelId].x, xSymmetric);
        const plotYValues = panelId === 'height'
            ? [...yValues, lastTerrainHeightMeters]
            : panelId === 'lateral'
                ? [...yValues, lastCarryRunDistanceYards]
                : yValues;
        const yRange = bounds(plotYValues, trajectoryZoom[panelId].y);
        xRange.min += trajectoryPan[panelId].x;
        xRange.max += trajectoryPan[panelId].x;
        yRange.min += trajectoryPan[panelId].y;
        yRange.max += trajectoryPan[panelId].y;
        trajectoryPlotRanges[panelId] = {
            left,
            right,
            top,
            bottom,
            xAxisBand: {
                left,
                right,
                top: bottom - 2,
                bottom: panel.y + panel.height
            },
            yAxisBand: {
                left: panel.x + 22,
                right: left + 2,
                top,
                bottom
            },
            xSpan: xRange.max - xRange.min,
            ySpan: yRange.max - yRange.min,
            xMin: xRange.min,
            xMax: xRange.max,
            yMin: yRange.min,
            yMax: yRange.max
        };
        const xTicks = tickValues(xRange);
        const yTicks = tickValues(yRange);
        const xToCanvas = (value) => left + (value - xRange.min) / (xRange.max - xRange.min) * plotWidth;
        const yToCanvas = (value) => bottom - (value - yRange.min) / (yRange.max - yRange.min) * plotHeight;

        context.fillStyle = 'pink';
        context.font = 'bold 13px sans-serif';
        context.fillText(title, panel.x + 8, panel.y + 20);
        context.font = '10px sans-serif';

        context.save();
        context.beginPath();
        context.rect(left, top, plotWidth, plotHeight);
        context.clip();
        for (const tick of xTicks.ticks) {
            const x = xToCanvas(tick);
            context.beginPath();
            context.strokeStyle = tick === 0 ? 'rgba(255, 192, 203, 0.6)' : 'rgba(255, 192, 203, 0.18)';
            context.lineWidth = tick === 0 ? 1.5 : 1;
            context.moveTo(x, top);
            context.lineTo(x, bottom);
            context.stroke();
        }
        for (const tick of yTicks.ticks) {
            const y = yToCanvas(tick);
            context.beginPath();
            context.strokeStyle = tick === 0 ? 'rgba(255, 192, 203, 0.6)' : 'rgba(255, 192, 203, 0.18)';
            context.lineWidth = tick === 0 ? 1.5 : 1;
            context.moveTo(left, y);
            context.lineTo(right, y);
            context.stroke();
        }
        if (referenceLineValue !== null) {
            const terrainY = yToCanvas(referenceLineValue);
            context.beginPath();
            context.setLineDash([6, 4]);
            context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            context.lineWidth = 1.5;
            context.moveTo(left, terrainY);
            context.lineTo(right, terrainY);
            context.stroke();
            context.setLineDash([]);
        }

        context.beginPath();
        pathPoints.forEach((point, index) => {
            const x = xToCanvas(point.x);
            const y = yToCanvas(point.y);
            if (index === 0)
                context.moveTo(x, y);
            else
                context.lineTo(x, y);
        });
        context.strokeStyle = pathColor;
        context.lineWidth = 2;
        context.stroke();

        for (const point of [pathPoints[0], pathPoints[pathPoints.length - 1]]) {
            context.beginPath();
            context.arc(xToCanvas(point.x), yToCanvas(point.y), 4, 0, Math.PI * 2);
            context.fillStyle = point === pathPoints[0] ? 'lime' : 'red';
            context.fill();
        }
        if (startLabel) {
            context.fillStyle = 'lime';
            context.textAlign = 'left';
            context.fillText(
                startLabel,
                xToCanvas(pathPoints[0].x) + 7,
                yToCanvas(pathPoints[0].y) - 7
            );
            context.textAlign = 'start';
        }

        for (const point of markerPoints) {
            const x = xToCanvas(point.x);
            const y = yToCanvas(point.y);
            context.beginPath();
            const markerStyle = {
                'Snap': { radius: 5, color: 'magenta' },
                'Height Peak': { radius: 5, color: 'red' },
                'Cobra Before Peak': { radius: 5, color: 'lime' }
            }[point.type] || { radius: 3.5, color: 'yellow' };
            context.arc(x, y, markerStyle.radius, 0, Math.PI * 2);
            context.fillStyle = markerStyle.color;
            context.fill();
        }
        const hover = trajectoryHover;
        if (hover && hover.panelId === panelId && !activeTrajectoryPan && !activeTrajectoryZoom) {
            const pointerX = Math.min(right, Math.max(left, hover.x));
            const pointerY = Math.min(bottom, Math.max(top, hover.y));
            let hoverX = pointerX;
            let hoverY = pointerY;
            let valueX = xRange.min + (pointerX - left) / plotWidth * (xRange.max - xRange.min);
            let valueY = yRange.max - (pointerY - top) / plotHeight * (yRange.max - yRange.min);
            let snapped = false;
            const importantPoints = [
                ...markerPoints,
                ...(pathPoints.length > 0
                    ? [
                        { ...pathPoints[0], type: 'Start' },
                        { ...pathPoints[pathPoints.length - 1], type: 'End' }
                    ]
                    : [])
            ];
            let closestPoint = null;
            let closestPointDistance = Infinity;

            for (const point of importantPoints) {
                const pointX = xToCanvas(point.x);
                const pointY = yToCanvas(point.y);
                if (pointX < left || pointX > right || pointY < top || pointY > bottom)
                    continue;

                const distance = Math.hypot(pointX - pointerX, pointY - pointerY);
                if (distance < closestPointDistance) {
                    closestPoint = point;
                    closestPointDistance = distance;
                }
            }

            if (closestPoint && closestPointDistance <= 14) {
                hoverX = xToCanvas(closestPoint.x);
                hoverY = yToCanvas(closestPoint.y);
                valueX = closestPoint.x;
                valueY = closestPoint.y;
                snapped = true;
            } else {
                let closestLinePoint = null;
                let closestLineDistance = Infinity;

                for (let index = 1; index < pathPoints.length; index++) {
                    const start = pathPoints[index - 1];
                    const end = pathPoints[index];
                    const startX = xToCanvas(start.x);
                    const startY = yToCanvas(start.y);
                    const endX = xToCanvas(end.x);
                    const endY = yToCanvas(end.y);
                    const segmentX = endX - startX;
                    const segmentY = endY - startY;
                    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
                    const fraction = segmentLengthSquared > 0
                        ? Math.min(1, Math.max(0,
                            ((pointerX - startX) * segmentX + (pointerY - startY) * segmentY) /
                            segmentLengthSquared))
                        : 0;
                    const pointX = startX + segmentX * fraction;
                    const pointY = startY + segmentY * fraction;
                    const distance = Math.hypot(pointX - pointerX, pointY - pointerY);
                    if (distance < closestLineDistance) {
                        closestLineDistance = distance;
                        closestLinePoint = {
                            x: start.x + (end.x - start.x) * fraction,
                            y: start.y + (end.y - start.y) * fraction,
                            canvasX: pointX,
                            canvasY: pointY
                        };
                    }
                }

                if (closestLinePoint && closestLineDistance <= 8) {
                    hoverX = closestLinePoint.canvasX;
                    hoverY = closestLinePoint.canvasY;
                    valueX = closestLinePoint.x;
                    valueY = closestLinePoint.y;
                    snapped = true;
                }
            }

            context.beginPath();
            context.setLineDash([4, 4]);
            context.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            context.lineWidth = 1;
            context.moveTo(hoverX, top);
            context.lineTo(hoverX, bottom);
            context.moveTo(left, hoverY);
            context.lineTo(right, hoverY);
            context.stroke();
            context.setLineDash([]);

            if (snapped) {
                context.beginPath();
                context.arc(hoverX, hoverY, 5, 0, Math.PI * 2);
                context.fillStyle = 'rgba(255, 255, 255, 0.2)';
                context.fill();
                context.strokeStyle = 'white';
                context.lineWidth = 1.5;
                context.stroke();
            }

            const dataType = closestPoint && closestPointDistance <= 14
                ? closestPoint.type
                : 'Trajectory';
            const coordinates = `(${valueX.toFixed(3)}, ${valueY.toFixed(3)})`;
            context.font = '11px sans-serif';
            const labelWidth = Math.max(
                context.measureText(dataType).width,
                context.measureText(coordinates).width
            ) + 12;
            const labelHeight = 36;
            const preferredLabelX = hoverX + labelWidth + 12 <= right
                ? hoverX + 10
                : hoverX - labelWidth - 10;
            const preferredLabelY = hoverY + labelHeight + 10 <= bottom
                ? hoverY + 10
                : hoverY - labelHeight - 10;
            const labelX = Math.min(right - labelWidth, Math.max(left, preferredLabelX));
            const labelY = Math.min(bottom - labelHeight, Math.max(top, preferredLabelY));
            context.fillStyle = 'rgba(20, 12, 28, 0.92)';
            context.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            context.lineWidth = 1;
            context.beginPath();
            context.roundRect(labelX, labelY, labelWidth, labelHeight, 4);
            context.fill();
            context.stroke();
            context.fillStyle = 'white';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(dataType, labelX + 6, labelY + 12);
            context.fillText(coordinates, labelX + 6, labelY + 26);
            context.textBaseline = 'alphabetic';
        }
        context.restore();

        context.strokeStyle = 'rgba(255, 192, 203, 0.55)';
        context.lineWidth = 1;
        context.strokeRect(left, top, plotWidth, plotHeight);
        context.fillStyle = 'pink';
        context.font = '10px sans-serif';
        context.textAlign = 'center';
        for (const tick of xTicks.ticks)
            context.fillText(formatTick(tick, xTicks.step), xToCanvas(tick), bottom + 13);
        context.textAlign = 'right';
        for (const tick of yTicks.ticks)
            context.fillText(formatTick(tick, yTicks.step), left - 5, yToCanvas(tick) + 3);
        context.textAlign = 'center';
        context.fillText(xLabel, left + plotWidth / 2, panel.y + panel.height - 5);
        context.save();
        context.translate(panel.x + 10, top + plotHeight / 2);
        context.rotate(-Math.PI / 2);
        context.fillText(yLabel, 0, 0);
        context.restore();
        context.textAlign = 'start';
    };

    const heightPeakIndex = lastTrajectory.reduce(
        (peakIndex, point, index, points) =>
            point.y > points[peakIndex].y ? index : peakIndex,
        0
    );
    const heightPeakPoint = lastTrajectory[heightPeakIndex];
    const importantMarkers = [
        ...(heightPeakPoint ? [{ point: heightPeakPoint, type: 'Height Peak' }] : []),
        ...(lastCobraBeforeRisePoint
            ? [{ point: lastCobraBeforeRisePoint, type: 'Before Cobra Rise' }]
            : []),
        ...(lastSnapPoint ? [{ point: lastSnapPoint, type: 'Snap' }] : []),
        ...(lastCarryPoint ? [{ point: lastCarryPoint, type: 'Carry' }] : []),
        ...lastBouncePoints.map((point, index) => ({
            point,
            type: `Bounce ${index + 1}`
        }))
    ];
    const lateralMarkers = importantMarkers.map(({ point, type }) => ({
        x: point.x * DESVIO_SCALE_PANGYA_TO_YARD * lastLateralScaleToPb,
        y: point.z / 3.2,
        type
    }));
    const heightMarkers = importantMarkers.map(({ point, type }) => ({
        x: point.z / 3.2,
        y: point.y * heightUnitToMeters,
        type
    }));
    drawPanel(
        panels[0],
        'lateral',
        'Lateral path',
        'Lateral position (pb)',
        'Distance (y)',
        values.lateral,
        values.distance,
        true,
        'cyan',
        lastTrajectory.map(point => ({
            x: point.x * DESVIO_SCALE_PANGYA_TO_YARD * lastLateralScaleToPb,
            y: point.z / 3.2
        })),
        lateralMarkers,
        '',
        lastCarryRunDistanceYards
    );
    drawPanel(
        panels[1],
        'height',
        'Height profile',
        'Distance (y)',
        'Height (m)',
        values.distance,
        values.height,
        false,
        'orange',
        lastTrajectory.map(point => ({
            x: point.z / 3.2,
            y: point.y * heightUnitToMeters
        })).map((point, index) => index === 0
            ? { x: point.x, y: golfRadiusMeters }
            : point),
        heightMarkers,
        '',
        lastTerrainHeightMeters
    );
}

function stopTrajectoryInteraction(event) {
    activeTrajectoryPan = null;
    activeTrajectoryZoom = null;
    if (event && trajectoryCanvas.hasPointerCapture(event.pointerId))
        trajectoryCanvas.releasePointerCapture(event.pointerId);
    trajectoryCanvas.style.cursor = 'grab';
}

document.getElementById('trajectory-zoom-reset').addEventListener('click', () => {
    for (const panelId of ['lateral', 'height']) {
        trajectoryZoom[panelId].x = 1;
        trajectoryZoom[panelId].y = 1;
        trajectoryPan[panelId].x = 0;
        trajectoryPan[panelId].y = 0;
    }
    renderTrajectory();
});
const trajectoryCanvas = document.getElementById('trajectory');
trajectoryCanvas.addEventListener('wheel', (event) => {
    const rect = trajectoryCanvas.getBoundingClientRect();
    const scaleX = trajectoryCanvas.clientWidth / rect.width;
    const scaleY = trajectoryCanvas.clientHeight / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const panelEntry = Object.entries(trajectoryPlotRanges).find(([, plot]) =>
        x >= plot.left && x <= plot.right && y >= plot.top && y <= plot.bottom
    );
    if (!panelEntry)
        return;

    event.preventDefault();
    const [panelId, plot] = panelEntry;
    const zoom = trajectoryZoom[panelId];
    const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    const pointerX = (x - plot.left) / (plot.right - plot.left);
    const pointerY = (y - plot.top) / (plot.bottom - plot.top);

    for (const [axis, pointer, minimum, maximum, panDirection] of [
        ['x', pointerX, plot.xMin, plot.xMax, 'x'],
        ['y', pointerY, plot.yMin, plot.yMax, 'y']
    ]) {
        const oldZoom = zoom[axis];
        const nextZoom = Math.min(64, Math.max(0.25, oldZoom * factor));
        const actualFactor = nextZoom / oldZoom;
        if (actualFactor === 1)
            continue;

        const rangeCenter = (minimum + maximum) / 2;
        const anchor = axis === 'x'
            ? minimum + pointer * (maximum - minimum)
            : maximum - pointer * (maximum - minimum);
        const targetCenter = anchor + (rangeCenter - anchor) / actualFactor;
        const baseCenter = rangeCenter - trajectoryPan[panelId][panDirection];
        zoom[axis] = nextZoom;
        trajectoryPan[panelId][panDirection] = targetCenter - baseCenter;
    }

    renderTrajectory();
}, { passive: false });
trajectoryCanvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0)
        return;

    const rect = trajectoryCanvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * trajectoryCanvas.clientWidth / rect.width;
    const y = (event.clientY - rect.top) * trajectoryCanvas.clientHeight / rect.height;
    const axisHit = Object.entries(trajectoryPlotRanges).find(([, plot]) =>
        (x >= plot.yAxisBand.left && x <= plot.yAxisBand.right &&
            y >= plot.yAxisBand.top && y <= plot.yAxisBand.bottom) ||
        (x >= plot.xAxisBand.left && x <= plot.xAxisBand.right &&
            y >= plot.xAxisBand.top && y <= plot.xAxisBand.bottom)
    );
    if (axisHit) {
        const [panelId, plot] = axisHit;
        const axis = x >= plot.yAxisBand.left && x <= plot.yAxisBand.right ? 'y' : 'x';
        activeTrajectoryZoom = {
            panelId,
            axis,
            x: event.clientX,
            y: event.clientY
        };
        trajectoryHover = null;
        trajectoryCanvas.setPointerCapture(event.pointerId);
        trajectoryCanvas.style.cursor = axis === 'x' ? 'ew-resize' : 'ns-resize';
        renderTrajectory();
        return;
    }

    const panelHit = Object.entries(trajectoryPlotRanges).find(([, plot]) =>
        x >= plot.left && x <= plot.right && y >= plot.top && y <= plot.bottom
    );
    if (!panelHit)
        return;

    const [panelId] = panelHit;
    activeTrajectoryPan = { panelId, x: event.clientX, y: event.clientY };
    trajectoryHover = null;
    trajectoryCanvas.setPointerCapture(event.pointerId);
    trajectoryCanvas.style.cursor = 'grabbing';
    renderTrajectory();
});
trajectoryCanvas.addEventListener('pointermove', (event) => {
    const rect = trajectoryCanvas.getBoundingClientRect();
    const scaleX = trajectoryCanvas.clientWidth / rect.width;
    const scaleY = trajectoryCanvas.clientHeight / rect.height;

    if (!activeTrajectoryZoom && !activeTrajectoryPan) {
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        const axisHit = Object.values(trajectoryPlotRanges).find((plot) =>
            (x >= plot.yAxisBand.left && x <= plot.yAxisBand.right &&
                y >= plot.yAxisBand.top && y <= plot.yAxisBand.bottom) ||
            (x >= plot.xAxisBand.left && x <= plot.xAxisBand.right &&
                y >= plot.xAxisBand.top && y <= plot.xAxisBand.bottom)
        );
        const plotHit = Object.entries(trajectoryPlotRanges).find(([, plot]) =>
            x >= plot.left && x <= plot.right && y >= plot.top && y <= plot.bottom
        );
        const nextHover = plotHit
            ? { panelId: plotHit[0], x, y }
            : null;
        if (!trajectoryHover ||
            !nextHover ||
            trajectoryHover.panelId !== nextHover.panelId ||
            trajectoryHover.x !== nextHover.x ||
            trajectoryHover.y !== nextHover.y) {
            trajectoryHover = nextHover;
            renderTrajectory();
        }
        if (axisHit) {
            const verticalAxis = x >= axisHit.yAxisBand.left && x <= axisHit.yAxisBand.right;
            trajectoryCanvas.style.cursor = verticalAxis ? 'ns-resize' : 'ew-resize';
        } else if (plotHit) {
            trajectoryCanvas.style.cursor = 'crosshair';
        } else {
            trajectoryCanvas.style.cursor = 'grab';
        }
        return;
    }

    if (activeTrajectoryZoom) {
        const delta = activeTrajectoryZoom.axis === 'x'
            ? (event.clientX - activeTrajectoryZoom.x) * scaleX
            : (activeTrajectoryZoom.y - event.clientY) * scaleY;
        if (delta !== 0) {
            const zoom = trajectoryZoom[activeTrajectoryZoom.panelId];
            const nextZoom = Math.min(64, Math.max(0.25,
                zoom[activeTrajectoryZoom.axis] * Math.exp(delta / 120)));
            zoom[activeTrajectoryZoom.axis] = nextZoom;
            activeTrajectoryZoom.x = event.clientX;
            activeTrajectoryZoom.y = event.clientY;
            renderTrajectory();
        }
        return;
    }

    if (!activeTrajectoryPan)
        return;

    const plot = trajectoryPlotRanges[activeTrajectoryPan.panelId];
    if (!plot)
        return;

    const deltaX = (event.clientX - activeTrajectoryPan.x) * scaleX;
    const deltaY = (event.clientY - activeTrajectoryPan.y) * scaleY;
    const pan = trajectoryPan[activeTrajectoryPan.panelId];
    pan.x -= deltaX / (plot.right - plot.left) * plot.xSpan;
    pan.y += deltaY / (plot.bottom - plot.top) * plot.ySpan;
    activeTrajectoryPan.x = event.clientX;
    activeTrajectoryPan.y = event.clientY;
    renderTrajectory();
});
trajectoryCanvas.addEventListener('pointerup', stopTrajectoryInteraction);
trajectoryCanvas.addEventListener('pointercancel', stopTrajectoryInteraction);
trajectoryCanvas.addEventListener('lostpointercapture', () => stopTrajectoryInteraction());
trajectoryCanvas.addEventListener('pointerleave', () => {
    if (activeTrajectoryPan || activeTrajectoryZoom || !trajectoryHover)
        return;
    trajectoryHover = null;
    renderTrajectory();
});
trajectoryCanvas.style.cursor = 'grab';
window.addEventListener('resize', renderTrajectory);

function calcMycella(el) {

    const align_degree = checkValidInput(document.querySelector('#mycella>#align-degree').value);
    const px = checkValidInput(document.querySelector('#mycella>#px').value);
    const slope_side = checkValidInput(document.querySelector('#mycella>#slope-side').value);
    const x_slope = checkValidInput(document.querySelector('#mycella>#x-slope').value);

    const slope_real = Math.abs((Math.cos(Math.abs(Math.PI  / 180 * (align_degree)))) * (px / 30.7));

    document.getElementById('slope_break').value = ((slope_real * x_slope) * slope_side).toFixed(4);
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

    document.getElementById('degree').value = angle360.toFixed(2);

}

function anglecalc2(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 180 - angle90;

    document.getElementById('degree').value = angle360.toFixed(2);

}

function anglecalc3(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 180 + angle90;

    document.getElementById('degree').value = angle360.toFixed(2);

}

function anglecalc4(value) {

    const angle90 = checkValidInput(document.querySelector('#degree90').value);

    const angle360 = 360 - angle90;

    document.getElementById('degree').value = angle360.toFixed(2);

}

const YARDS_TO_PB = 0.2167;

function desvioByDegree(yards, distance) {
    return Math.sin(Math.atan2(yards * 1.5, distance)) * distance / 1.5;
}