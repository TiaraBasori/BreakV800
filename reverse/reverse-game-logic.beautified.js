    Nu = [0, 55, 95, 140, 190, 260],
    Pu = 900,
    Fu = 6700;

function Iu(e) {
    for (let t = 1; t < Nu.length; t++)
        if (e <= Nu[t] || t === Nu.length - 1) {
            let n = Nu[t - 1] * (t === 1 ? 1 : .62);
            return {
                rpm: 1500 + Math.min(1, Math.max(0, (e - n) / (Nu[t] - n))) * 5200,
                gear: t
            }
        } return {
        rpm: Pu,
        gear: 1
    }
}
var Lu = class {
        ctx = null;
        master = null;
        noise = null;
        loops = null;
        coastRpm = Pu;
        muted = !1;
        unlock() {
            if (!this.ctx) {
                let e = new(window.AudioContext ?? window.webkitAudioContext),
                    t = e.createDynamicsCompressor();
                t.threshold.value = -14, t.ratio.value = 4;
                let n = e.createGain();
                n.gain.value = this.muted ? 0 : .8, n.connect(t).connect(e.destination);
                let r = e.createBuffer(1, e.sampleRate * 2, e.sampleRate),
                    i = r.getChannelData(0);
                for (let e = 0; e < i.length; e++) i[e] = Math.random() * 2 - 1;
                this.ctx = e, this.master = n, this.noise = r
            }
            this.ctx.state === `suspended` && this.ctx.resume()
        }
        setMuted(e) {
            this.muted = e, this.ctx && this.master && this.master.gain.setTargetAtTime(e ? 0 : .8, this.ctx.currentTime, .05)
        }
        noiseSource() {
            if (!this.ctx || !this.noise) return null;
            let e = this.ctx.createBufferSource();
            return e.buffer = this.noise, e.loop = !0, e.loopStart = Math.random(), e
        }
        startLoops() {
            let e = this.ctx,
                t = this.master;
            if (!e || !t) return;
            this.stopLoops(0);
            let n = e.createBiquadFilter();
            n.type = `lowpass`, n.frequency.value = 600, n.Q.value = 3;
            let r = e.createGain();
            r.gain.value = 0, n.connect(r).connect(t);
            let i = e.createOscillator();
            i.type = `sawtooth`;
            let a = e.createOscillator();
            a.type = `square`, a.detune.value = 12;
            let o = e.createOscillator();
            o.type = `sine`;
            let s = e.createGain();
            s.gain.value = .35;
            let c = e.createGain();
            c.gain.value = .18;
            let l = e.createGain();
            l.gain.value = .6, i.connect(s).connect(n), a.connect(c).connect(n), o.connect(l).connect(n);
            let u = e.createOscillator();
            u.type = `sine`;
            let d = e.createGain();
            d.gain.value = 0, u.connect(d).connect(t);
            let f = this.noiseSource(),
                p = e.createBiquadFilter();
            p.type = `bandpass`, p.frequency.value = 500, p.Q.value = .6;
            let m = e.createGain();
            m.gain.value = 0, f?.connect(p).connect(m).connect(t);
            let h = this.noiseSource(),
                g = e.createBiquadFilter();
            g.type = `lowpass`, g.frequency.value = 220;
            let _ = e.createGain();
            _.gain.value = 0, h?.connect(g).connect(_).connect(t);
            let v = this.noiseSource(),
                y = e.createBiquadFilter();
            y.type = `bandpass`, y.frequency.value = 2600, y.Q.value = 9;
            let b = e.createGain();
            b.gain.value = 0;
            let x = e.createOscillator();
            x.type = `triangle`, x.frequency.value = 1750;
            let S = e.createOscillator();
            S.frequency.value = 13;
            let C = e.createGain();
            C.gain.value = 45, S.connect(C).connect(x.frequency);
            let w = e.createGain();
            w.gain.value = .12, v?.connect(y).connect(b), x.connect(w).connect(b), b.connect(t);
            let T = e.createOscillator();
            T.type = `sawtooth`, T.frequency.value = 70;
            let E = e.createBiquadFilter();
            E.type = `bandpass`, E.frequency.value = 900, E.Q.value = 6;
            let D = e.createGain();
            D.gain.value = 0, T.connect(E).connect(D).connect(t);
            let O = [i, a, o, u, x, S, T];
            for (let e of [f, h, v]) e && O.push(e);
            for (let e of O) e.start();
            this.loops = {
                engineGain: r,
                engineFilter: n,
                oscA: i,
                oscB: a,
                oscSub: o,
                whine: u,
                whineGain: d,
                windGain: m,
                windFilter: p,
                roadGain: _,
                squealGain: b,
                squealFilter: y,
                squealTone: x,
                stressGain: D,
                stressOsc: T,
                sources: O
            }, this.coastRpm = Pu
        }
        stopLoops(e = .25) {
            let t = this.ctx,
                n = this.loops;
            if (!t || !n) return;
            this.loops = null;
            let r = t.currentTime;
            for (let t of [n.engineGain, n.whineGain, n.windGain, n.roadGain, n.squealGain, n.stressGain]) t.gain.cancelScheduledValues(r), t.gain.setTargetAtTime(0, r, Math.max(.01, e / 3));
            for (let t of n.sources) t.stop(r + e + .05)
        }
        update(e, t) {
            let n = this.ctx,
                r = this.loops;
            if (!n || !r) return;
            let i = n.currentTime,
                a = .05,
                o = Math.min(1, e.speedKmh / 260),
                s, c;
            e.powered ? (s = e.rolling ? Iu(e.speedKmh).rpm : Pu + Math.sin(i * 3) * 40, c = e.rolling ? .32 + o * .18 : .2, this.coastRpm = s) : (this.coastRpm += (Pu - this.coastRpm) * Math.min(1, t * 1.6), s = this.coastRpm, c = .14);
            let l = s / 60 * 3;
            r.oscA.frequency.setTargetAtTime(l, i, a), r.oscB.frequency.setTargetAtTime(l * 1.5, i, a), r.oscSub.frequency.setTargetAtTime(l / 2, i, a), r.engineFilter.frequency.setTargetAtTime(400 + s / Fu * 2600 * (e.powered ? 1 : .4), i, a), r.engineGain.gain.setTargetAtTime(c, i, .08), r.whine.frequency.setTargetAtTime(380 + e.speedKmh * 22, i, a), r.whineGain.gain.setTargetAtTime(e.powered && e.rolling ? .025 + o * .04 : .008, i, .1), r.windGain.gain.setTargetAtTime(o * o * .55, i, .1), r.windFilter.frequency.setTargetAtTime(350 + o * 1400, i, .1), r.roadGain.gain.setTargetAtTime(Math.min(.5, e.speedKmh / 200) * .6, i, .1);
            let u = e.pedalForce / e.breakForce,
                d = +(e.speedKmh > 1);
            r.squealGain.gain.setTargetAtTime(d * u ** 1.6 * .55, i, .04), r.squealFilter.frequency.setTargetAtTime(1900 + u * 1700, i, .05), r.squealTone.frequency.setTargetAtTime(1500 + u * 900, i, .05);
            let f = Math.max(0, (u - .72) / .28);
            r.stressGain.gain.setTargetAtTime(f * f * .45 * (.6 + .4 * Math.sin(i * 34)), i, .02), r.stressOsc.frequency.setTargetAtTime(55 + f * 60, i, .05)
        }
        envGain(e, t, n, r) {
            if (!this.ctx || !this.master) return null;
            let i = this.ctx.createGain();
            return i.gain.setValueAtTime(1e-4, e), i.gain.exponentialRampToValueAtTime(t, e + n), i.gain.exponentialRampToValueAtTime(1e-4, e + n + r), i.connect(this.master), i
        }
        tone(e, t, n, r, i, a) {
            let o = this.ctx,
                s = this.envGain(r, i, .005, a);
            if (!o || !s) return;
            let c = o.createOscillator();
            c.type = e, c.frequency.setValueAtTime(t, r), n !== t && c.frequency.exponentialRampToValueAtTime(n, r + a), c.connect(s), c.start(r), c.stop(r + a + .1)
        }
        noiseBurst(e, t, n, r, i, a = 1) {
            let o = this.ctx,
                s = this.envGain(e, t, .004, n),
                c = this.noiseSource();
            if (!o || !s || !c) return;
            c.loop = !1;
            let l = o.createBiquadFilter();
            l.type = r, l.frequency.value = i, l.Q.value = a, c.connect(l).connect(s), c.start(e, Math.random()), c.stop(e + n + .1)
        }
        ignition() {
            let e = this.ctx;
            if (!e || !this.master) return;
            let t = e.currentTime,
                n = e.createGain();
            n.gain.setValueAtTime(1e-4, t), n.gain.exponentialRampToValueAtTime(.35, t + .05), n.gain.setValueAtTime(.35, t + .6), n.gain.exponentialRampToValueAtTime(1e-4, t + .8);
            let r = e.createBiquadFilter();
            r.type = `lowpass`, r.frequency.value = 900, n.connect(this.master);
            let i = e.createOscillator();
            i.type = `sawtooth`, i.frequency.setValueAtTime(140, t), i.frequency.linearRampToValueAtTime(210, t + .7);
            let a = e.createOscillator();
            a.frequency.value = 16;
            let o = e.createGain();
            o.gain.value = .5;
            let s = e.createGain();
            s.gain.value = .5, a.connect(o).connect(s.gain), i.connect(r).connect(s).connect(n), i.start(t), a.start(t), i.stop(t + .85), a.stop(t + .85), this.tone(`sine`, 90, 45, t + .72, .8, .45), this.noiseBurst(t + .72, .4, .25, `lowpass`, 400)
        }
        countdownBeep(e) {
            if (!this.ctx) return;
            let t = this.ctx.currentTime;
            this.tone(`square`, e ? 1320 : 660, e ? 1320 : 660, t, .18, e ? .5 : .18)
        }
        revBlip() {
            if (!this.ctx) return;
            let e = this.ctx.currentTime;
            this.tone(`sawtooth`, 120, 260, e, .2, .35)
        }
        brakeClick() {
            if (!this.ctx) return;
            let e = this.ctx.currentTime;
            this.noiseBurst(e, .6, .06, `bandpass`, 3200, 2), this.tone(`sine`, 220, 120, e, .3, .12)
        }
        warn() {
            if (!this.ctx) return;
            let e = this.ctx.currentTime;
            this.tone(`square`, 980, 980, e, .08, .09)
        }
        snap() {
            if (!this.ctx) return;
            let e = this.ctx.currentTime;
            this.noiseBurst(e, 1.4, .08, `highpass`, 2200, .7), this.noiseBurst(e + .01, .9, .2, `bandpass`, 5200, 3);
            for (let [t, n] of [
                    [1850, 1.4],
                    [2930, 1.1],
                    [4410, .8],
                    [6120, .6]
                ]) this.tone(`sine`, t, t * .985, e, .22, n);
            this.tone(`sine`, 140, 38, e, 1, .45)
        }
        impact(e) {
            if (!this.ctx) return;
            let t = this.ctx.currentTime,
                n = Math.max(.15, Math.min(1, e));
            this.noiseBurst(t, 1.2 * n, .5 + n * .5, `lowpass`, 700 + n * 1200), this.tone(`sine`, 85, 28, t, 1.1 * n, .6), this.noiseBurst(t, .5 * n, .25, `bandpass`, 1800, 1.5);
            let r = Math.floor(6 + n * 18);
            for (let e = 0; e < r; e++) {
                let e = t + .02 + Math.random() * .55,
                    r = 3e3 + Math.random() * 5e3;
                this.tone(`sine`, r, r, e, .05 + Math.random() * .08 * n, .04 + Math.random() * .12)
            }
        }
        success() {
            if (!this.ctx) return;
            let e = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((t, n) => {
                this.tone(`triangle`, t, t, e + n * .11, .3, .9)
            })
        }
        fail() {
            if (!this.ctx) return;
            let e = this.ctx.currentTime + .4;
            [392, 311.13, 233.08].forEach((t, n) => {
                this.tone(`sawtooth`, t, t * .97, e + n * .22, .12, .5)
            })
        }
        uiClick() {
            this.ctx && this.tone(`sine`, 900, 700, this.ctx.currentTime, .12, .06)
        }
    },
    Ru = new U;

function zu(e, t, n, r, i, a) {
    let o = 2 * Math.PI * i / 4,
        s = Math.max(a - 2 * i, 0),
        c = Math.PI / 4;
    Ru.copy(t), Ru[r] = 0, Ru.normalize();
    let l = .5 * o / (o + s),
        u = 1 - Ru.angleTo(e) / c;
    return Math.sign(Ru[n]) === 1 ? u * l : s / (o + s) + l + l * (1 - u)
}
var Bu = class e extends Ti {
    constructor(e = 1, t = 1, n = 1, r = 2, i = .1) {
        let a = r * 2 + 1;
        if (i = Math.min(e / 2, t / 2, n / 2, i), super(1, 1, 1, a, a, a), this.type = `RoundedBoxGeometry`, this.parameters = {
                width: e,
                height: t,
                depth: n,
                segments: r,
                radius: i
            }, a === 1) return;
        let o = this.toNonIndexed();
        this.index = null, this.attributes.position = o.attributes.position, this.attributes.normal = o.attributes.normal, this.attributes.uv = o.attributes.uv;
        let s = new U,
            c = new U,
            l = new U(e, t, n).divideScalar(2).subScalar(i),
            u = this.attributes.position.array,
            d = this.attributes.normal.array,
            f = this.attributes.uv.array,
            p = u.length / 6,
            m = new U,
            h = .5 / a;
        for (let r = 0, a = 0; r < u.length; r += 3, a += 2) switch (s.fromArray(u, r), c.copy(s), c.x -= Math.sign(c.x) * h, c.y -= Math.sign(c.y) * h, c.z -= Math.sign(c.z) * h, c.normalize(), u[r + 0] = l.x * Math.sign(s.x) + c.x * i, u[r + 1] = l.y * Math.sign(s.y) + c.y * i, u[r + 2] = l.z * Math.sign(s.z) + c.z * i, d[r + 0] = c.x, d[r + 1] = c.y, d[r + 2] = c.z, Math.floor(r / p)) {
            case 0:
                m.set(1, 0, 0), f[a + 0] = zu(m, c, `z`, `y`, i, n), f[a + 1] = 1 - zu(m, c, `y`, `z`, i, t);
                break;
            case 1:
                m.set(-1, 0, 0), f[a + 0] = 1 - zu(m, c, `z`, `y`, i, n), f[a + 1] = 1 - zu(m, c, `y`, `z`, i, t);
                break;
            case 2:
                m.set(0, 1, 0), f[a + 0] = 1 - zu(m, c, `x`, `z`, i, e), f[a + 1] = zu(m, c, `z`, `x`, i, n);
                break;
            case 3:
                m.set(0, -1, 0), f[a + 0] = 1 - zu(m, c, `x`, `z`, i, e), f[a + 1] = 1 - zu(m, c, `z`, `x`, i, n);
                break;
            case 4:
                m.set(0, 0, 1), f[a + 0] = 1 - zu(m, c, `x`, `y`, i, e), f[a + 1] = 1 - zu(m, c, `y`, `x`, i, t);
                break;
            case 5:
                m.set(0, 0, -1), f[a + 0] = zu(m, c, `x`, `y`, i, e), f[a + 1] = 1 - zu(m, c, `y`, `x`, i, t)
        }
    }
    static fromJSON(t) {
        return new e(t.width, t.height, t.depth, t.segments, t.radius)
    }
};

function Vu(e, t = 1e-4) {
    t = Math.max(t, 2 ** -52);
    let n = {},
        r = e.getIndex(),
        i = e.getAttribute(`position`),
        a = r ? r.count : i.count,
        o = 0,
        s = Object.keys(e.attributes),
        c = {},
        l = {},
        u = [],
        d = [`getX`, `getY`, `getZ`, `getW`],
        f = [`setX`, `setY`, `setZ`, `setW`];
    for (let t = 0, n = s.length; t < n; t++) {
        let n = s[t],
            r = e.attributes[n];
        c[n] = new r.constructor(new r.array.constructor(r.count * r.itemSize), r.itemSize, r.normalized);
        let i = e.morphAttributes[n];
        i && (l[n] || (l[n] = []), i.forEach((e, t) => {
            let r = new e.array.constructor(e.count * e.itemSize);
            l[n][t] = new e.constructor(r, e.itemSize, e.normalized)
        }))
    }
    let p = t * .5,
        m = 10 ** Math.log10(1 / t),
        h = p * m;
    for (let t = 0; t < a; t++) {
        let i = r ? r.getX(t) : t,
            a = ``;
        for (let t = 0, n = s.length; t < n; t++) {
            let n = s[t],
                r = e.getAttribute(n),
                o = r.itemSize;
            for (let e = 0; e < o; e++) a += `${Math.trunc(r[d[e]](i)*m+h)},`
        }
        if (a in n) u.push(n[a]);
        else {
            for (let t = 0, n = s.length; t < n; t++) {
                let n = s[t],
                    r = e.getAttribute(n),
                    a = e.morphAttributes[n],
                    u = r.itemSize,
                    p = c[n],
                    m = l[n];
                for (let e = 0; e < u; e++) {
                    let t = d[e],
                        n = f[e];
                    if (p[n](o, r[t](i)), a)
                        for (let e = 0, r = a.length; e < r; e++) m[e][n](o, a[e][t](i))
                }
            }
            n[a] = o, u.push(o), o++
        }
    }
    let g = e.clone();
    for (let t in e.attributes) {
        let e = c[t];
        if (g.setAttribute(t, new e.constructor(e.array.slice(0, o * e.itemSize), e.itemSize, e.normalized)), t in l)
            for (let e = 0; e < l[t].length; e++) {
                let n = l[t][e];
                g.morphAttributes[t][e] = new n.constructor(n.array.slice(0, o * n.itemSize), n.itemSize, n.normalized)
            }
    }
    return g.setIndex(u), g
}

function Hu() {
    return {
        blackPaint: new uo({
            color: 460554,
            metalness: .55,
            roughness: .22,
            clearcoat: 1,
            clearcoatRoughness: .03,
            envMapIntensity: 1.4
        }),
        goldPaint: new uo({
            color: 14929830,
            metalness: .5,
            roughness: .32,
            clearcoat: 1,
            clearcoatRoughness: .05,
            envMapIntensity: 1.25
        }),
        chrome: new lo({
            color: 16777215,
            metalness: 1,
            roughness: .06,
            envMapIntensity: 1.6
        }),
        satinGold: new lo({
            color: 14866113,
            metalness: 1,
            roughness: .2,
            envMapIntensity: 1.4
        }),
        glass: new uo({
            color: 263430,
            metalness: 0,
            roughness: .03,
            envMapIntensity: 1.1
        }),
        trimBlack: new lo({
            color: 328966,
            metalness: .4,
            roughness: .35
        }),
        rubber: new lo({
            color: 1381653,
            metalness: 0,
            roughness: .88
        }),
        darkMetal: new lo({
            color: 2829359,
            metalness: .9,
            roughness: .42
        }),
        brakeDisc: new lo({
            color: 9079694,
            metalness: .95,
            roughness: .3,
            emissive: new G(16726528),
            emissiveIntensity: 0
        }),
        caliper: new lo({
            color: 12096090,
            metalness: .7,
            roughness: .3
        }),
        headlight: new lo({
            color: 16777215,
            emissive: new G(16054271),
            emissiveIntensity: 4
        }),
        taillight: new lo({
            color: 3342336,
            emissive: new G(16715792),
            emissiveIntensity: 1.6
        }),
        lampHousing: new uo({
            color: 1053205,
            metalness: .6,
            roughness: .1,
            clearcoat: 1
        }),
        shadow: new zr({
            color: 0,
            transparent: !0,
            opacity: .65,
            depthWrite: !1
        })
    }
}
var Uu = 1.99,
    Wu = Uu / 2,
    Gu = .1,
    Ku = 1.86,
    qu = Ku / 2,
    Ju = .42,
    Yu = .85,
    Xu = -1.62,
    Zu = 1.58,
    Qu = .56,
    $u = .2,
    ed = .12,
    td = .08,
    nd = -2.705,
    rd = 2.705;

function id(e, t, n) {
    let r = Math.min(1, Math.max(0, (n - e) / (t - e)));
    return r * r * (3 - 2 * r)
}

function ad(e, t, n) {
    let r = Math.min(1, Math.abs(e) / n) ** 4;
    return $u * r * id(-2, -2.75, t) - ed * r * id(2, 2.75, t)
}

function od(e, t = 0) {
    return nd + $u * Math.min(1, Math.abs(e) / Wu) ** 4 - t
}

function sd(e, t = Wu, n = rd, r = 0) {
    return n - ed * Math.min(1, Math.abs(e) / t) ** 4 + r
}

function cd(e) {
    return 1 - td * Math.min(1, Math.max(0, (e - 1.1) / .85))
}

function ld(e, t, n, r = .12) {
    let i = e.currentPoint.clone(),
        a = Math.max(1, Math.ceil(i.distanceTo(new H(t, n)) / r));
    for (let r = 1; r <= a; r++) e.lineTo(i.x + (t - i.x) * r / a, i.y + (n - i.y) * r / a)
}

function ud(e, t) {
    let n = t.width - t.bevel * 2,
        r = new Ha(e, {
            depth: n,
            steps: t.steps ?? 14,
            bevelEnabled: !0,
            bevelThickness: t.bevel,
            bevelSize: t.bevel * .8,
            bevelSegments: 8,
            curveSegments: 28
        });
    r.translate(0, 0, -n / 2), r.rotateY(-Math.PI / 2);
    let i = t.width / 2,
        a = r.attributes.position;
    for (let e = 0; e < a.count; e++) {
        let n = a.getX(e),
            r = a.getY(e),
            o = a.getZ(e);
        t.tumblehome && (n *= cd(r)), o += ad(n, o, i), n *= 1 - .035 * id(-1.9, -2.75, o) - .02 * id(2.1, 2.75, o), a.setXYZ(e, n, r, o)
    }
    return r.deleteAttribute(`normal`), r.deleteAttribute(`uv`), r = Vu(r, 1e-4), r.computeVertexNormals(), r
}

function dd(e, t, n, r = 48) {
    return new q(new Qa(new Li(e, !1, `centripetal`), r, t, 8, !1), n)
}

function fd(e, t, n, r, i = 10) {
    let a = new Di(n, n, e.distanceTo(t), i, 1);
    a.rotateX(Math.PI / 2);
    let o = new q(a, r);
    return o.position.copy(e).lerp(t, .5), o.lookAt(t), o
}

function pd(e, t, n, r, i) {
    return new q(new Bu(e, t, n, 3, Math.min(r, e / 2, t / 2, n / 2)), i)
}

function md(e, t, n, r, i, a = 0) {
    let o = [];
    for (let r = 0; r <= 16; r++) {
        let i = e + (t - e) * r / 16;
        o.push(new U(i, n, od(i, a)))
    }
    return dd(o, r, i, 64)
}

function hd(e, t, n, r, i, a = 0) {
    let o = [];
    for (let r = 0; r <= 16; r++) {
        let i = e + (t - e) * r / 16;
        o.push(new U(i, n, sd(i, Wu, rd, a)))
    }
    return dd(o, r, i, 64)
}

function gd(e, t, n, r, i, a = .004) {
    let o = new Ka(e, t, 24, 1);
    o.rotateY(Math.PI);
    let s = o.attributes.position;
    for (let e = 0; e < s.count; e++) {
        let t = s.getX(e) + n;
        s.setXYZ(e, t, s.getY(e) + r, od(t, a))
    }
    return o.computeVertexNormals(), new q(o, i)
}

function _d(e, t, n, r, i, a) {
    let o = new Ka(e, n - t, 24, 6),
        s = o.attributes.position;
    for (let e = 0; e < s.count; e++) {
        let a = s.getY(e) + (t + n) / 2,
            o = s.getX(e) * cd(a);
        s.setXYZ(e, o, a, sd(o, r, i, .004))
    }
    return o.computeVertexNormals(), new q(o, a)
}

function vd(e, t, n, r, i, a = 0) {
    let o = new ia;
    return o.moveTo(e + i, t), o.lineTo(n - i, t), o.quadraticCurveTo(n, t, n, t + i), o.lineTo(n - a, r - i), o.quadraticCurveTo(n - a, r, n - a - i, r), o.lineTo(e + a + i, r), o.quadraticCurveTo(e + a, r, e + a, r - i), o.lineTo(e, t + i), o.quadraticCurveTo(e, t, e + i, t), o
}

function yd() {
    let e = new ia,
        t = Math.asin(.14 / Qu),
        n = Math.cos(t) * Qu;
    return e.moveTo(-2.56, .3), e.quadraticCurveTo(-2.5, .25, -2.3, .25), ld(e, Xu - n, .26), e.absarc(Xu, .4, Qu, Math.PI + t, -t, !0), ld(e, Zu - n, .26), e.absarc(Zu, .4, Qu, Math.PI + t, -t, !0), ld(e, 2.4, .26), e.quadraticCurveTo(2.58, .27, 2.6, .42), ld(e, 2.62, .98), e.quadraticCurveTo(2.63, 1.1, 2.52, 1.1), ld(e, -1.35, 1.1), e.quadraticCurveTo(-2.1, 1.02, -2.42, .95), e.quadraticCurveTo(-2.6, .9, -2.61, .74), ld(e, -2.62, .45), e.quadraticCurveTo(-2.62, .32, -2.56, .3), e
}

function bd() {
    let e = new ia;
    return e.moveTo(-1.26, 1.16), e.quadraticCurveTo(-2.1, 1.08, -2.42, 1.01), e.quadraticCurveTo(-2.6, .96, -2.64, .85), e.lineTo(-2.6, .8), e.quadraticCurveTo(-2.3, .94, -1.26, 1.06), e.closePath(), e
}

function xd() {
    let e = new ia;
    return e.moveTo(-1.38, 1.04), ld(e, -.52, 1.8), e.quadraticCurveTo(-.38, 1.92, -.05, 1.93), ld(e, 2.3, 1.94), e.quadraticCurveTo(2.58, 1.94, 2.59, 1.72), ld(e, 2.6, 1.04), ld(e, -1.38, 1.04), e
}
var Sd = [{
    shape: () => {
        let e = new ia;
        return e.moveTo(-1.16, 1.2), e.lineTo(-.58, 1.72), e.quadraticCurveTo(-.48, 1.8, -.34, 1.8), e.lineTo(-.16, 1.8), e.lineTo(-.16, 1.2), e.closePath(), e
    }
}, {
    shape: () => vd(-.02, 1.2, 1.36, 1.8, .03)
}, {
    shape: () => {
        let e = new ia;
        return e.moveTo(1.48, 1.2), e.lineTo(2.22, 1.2), e.quadraticCurveTo(2.36, 1.2, 2.37, 1.34), e.lineTo(2.37, 1.62), e.quadraticCurveTo(2.36, 1.78, 2.18, 1.78), e.lineTo(1.48, 1.78), e.closePath(), e
    }
}];

function Cd(e, t) {
    let n = new ia;
    return n.moveTo(-e / 2, t / 2), n.lineTo(e / 2, t / 2), n.lineTo(e / 2, -t * .1), n.quadraticCurveTo(e / 2, -t * .4, 0, -t / 2), n.quadraticCurveTo(-e / 2, -t * .4, -e / 2, -t * .1), n.closePath(), n
}

function wd() {
    let e = document.createElement(`canvas`);
    e.width = 640, e.height = 200;
    let t = e.getContext(`2d`);
    if (t) {
        let e = t.createLinearGradient(0, 0, 0, 200);
        e.addColorStop(0, `#f4fbf2`), e.addColorStop(.45, `#bfe8b8`), e.addColorStop(1, `#3fbf5f`), t.fillStyle = e, t.beginPath(), t.roundRect(4, 4, 632, 192, 18), t.fill(), t.strokeStyle = `#1b1b1b`, t.lineWidth = 5, t.beginPath(), t.roundRect(14, 14, 612, 172, 12), t.stroke(), t.fillStyle = `#111`, t.textAlign = `center`, t.textBaseline = `middle`, t.font = `bold 92px "PingFang SC", "Microsoft YaHei", "DIN Alternate", sans-serif`, t.fillText(`沪A·D1612F`, 320, 108)
    }
    let n = new xi(e);
    return n.colorSpace = Re, n.anisotropy = 8, n
}

function Td(e) {
    let t = new Tn,
        n = (e, t, n) => new U(e, t, n),
        r = (e, t = 0) => -(qu * cd(e) + .004 + t);
    for (let n of Sd) {
        let i = new Ja(n.shape(), 24);
        i.rotateY(-Math.PI / 2);
        let a = i.attributes.position;
        for (let e = 0; e < a.count; e++) a.setX(e, r(a.getY(e)));
        i.computeVertexNormals(), t.add(new q(i, e.glass))
    }
    let i = -Math.atan(qu * td / .85);
    for (let [n, a] of [
            [-.09, .14],
            [1.42, .12]
        ]) {
        let o = pd(.012, .6, a, .005, e.lampHousing);
        o.position.set(r(1.5, .002), 1.5, n), o.rotation.z = i, t.add(o)
    }
    let a = 1.83,
        o = 1.17;
    t.add(dd([n(r(o, .008), o, -1.22), n(r(1.5, .008), 1.5, -.88), n(r(1.76, .008), 1.76, -.56), n(r(a, .008), a, -.3), n(r(a, .008), a, 1), n(r(a, .008), a, 2.2), n(r(1.74, .008), 1.74, 2.4), n(r(1.45, .008), 1.45, 2.42), n(r(o, .008), o, 2.42)], .011, e.chrome, 120));
    let s = -.998;
    t.add(dd([n(s, 1.08, 2.62), n(s, 1.08, 1), n(s, 1.08, -1.2), n(-.994, 1.04, -1.85), n(-.983, .98, -2.3)], .012, e.chrome, 96)), t.add(fd(n(s, .36, -1), n(s, .36, .9600000000000001), .016, e.chrome)), t.add(fd(n(-.988, .42, -2.35), n(s, .42, -2.2800000000000002), .01, e.chrome));
    for (let n of [-.09, 1.42]) {
        let r = new q(new Ti(.006, .66, .005), e.trimBlack);
        r.position.set(s, .74, n), t.add(r)
    }
    let c = new q(new Ti(.006, .005, 2.1), e.trimBlack);
    c.position.set(s, 1, 1.36), t.add(c);
    let l = new q(new Ti(.006, .005, 2), e.trimBlack);
    l.position.set(s, .46, .4), t.add(l);
    let u = pd(.022, .03, .18, .012, e.chrome);
    u.position.set(-1.004, .95, -.4), t.add(u);
    let d = pd(.022, .034, .46, .014, e.chrome);
    d.position.set(-1.004, .95, 1.12), t.add(d);
    let f = pd(.16, .04, .07, .018, e.lampHousing);
    f.position.set(-.99, 1.2, -1.08), t.add(f);
    let p = new Xa(1, 28, 18);
    p.scale(.07, .095, .15);
    let m = new q(p, e.blackPaint);
    m.position.set(-1.135, 1.27, -1.06), m.rotation.y = .12, t.add(m);
    let h = new Xa(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    h.scale(.072, .05, .152);
    let g = new q(h, e.goldPaint);
    g.position.set(-1.135, 1.3, -1.06), g.rotation.y = .12, t.add(g);
    let _ = pd(.012, .012, .12, .005, e.headlight);
    _.position.set(-1.2, 1.24, -1.08), t.add(_);
    let v = pd(.008, .04, .14, .008, e.chrome);
    return v.position.set(s, .84, -1.95), t.add(v), t
}

function Ed(e) {
    let t = new Tn;
    t.add(gd(1.62, .34, 0, .6, e.lampHousing, .003)), t.add(md(-.8, .8, .775, .009, e.chrome, .004)), t.add(md(-.8, .8, .425, .007, e.chrome, .004));
    for (let n = 0; n < 11; n++) {
        let r = -.5 + n * .1,
            i = fd(new U(r, .46, od(r, .008)), new U(r, .74, od(r, .008)), .005, e.darkMetal, 6);
        t.add(i)
    }
    t.add(md(-.9, .9, .8, .011, e.headlight, .006));
    for (let n of [-1, 1]) {
        let r = n * .8,
            i = od(r, .012),
            a = pd(.17, .36, .05, .03, e.lampHousing);
        a.position.set(r, .6, i + .02), a.rotation.y = n * .35, t.add(a);
        for (let a = 0; a < 4; a++) {
            let o = pd(.11, .055, .03, .012, e.headlight);
            o.position.set(r, .47 + a * .087, i), o.rotation.y = n * .35, t.add(o);
            let s = new q(new Di(.018, .018, .01, 16), e.chrome);
            s.rotation.x = Math.PI / 2, s.position.set(r - n * .03, .47 + a * .087, i - .012), t.add(s)
        }
        t.add(fd(new U(r - n * .1, .42, od(r - n * .1, .006)), new U(r - n * .1, .78, od(r - n * .1, .006)), .006, e.chrome, 6)), t.add(md(n * .42, n * .86, .31, .012, e.headlight, .004))
    }
    let n = new q(new Ha(Cd(.1, .14), {
        depth: .012,
        bevelEnabled: !0,
        bevelThickness: .006,
        bevelSize: .006,
        bevelSegments: 3
    }), e.chrome);
    n.rotation.y = Math.PI, n.position.set(0, .62, od(0, .012)), t.add(n);
    for (let [n, r] of [
            [.25, .7],
            [.215, .6]
        ]) t.add(md(-r, r, n, .008, e.chrome, .002));
    let r = gd(.48, .15, 0, .36, new lo({
        map: wd(),
        roughness: .35,
        metalness: .1
    }), .012);
    return t.add(r), t
}

function Dd(e) {
    let t = new Tn;
    t.add(_d(1.46, 1.22, 1.8, qu, 2.68, e.glass)), t.add(hd(-.92, .92, 1.13, .008, e.chrome, .002)), t.add(hd(-.9, .9, 1.02, .022, e.taillight, .006)), t.add(hd(-.82, .82, .96, .007, e.chrome, .004));
    for (let n of [-1, 1]) {
        let r = n * .9,
            i = pd(.05, .36, .04, .02, e.taillight);
        i.position.set(r, .82, sd(r, Wu, rd, 0)), i.rotation.y = -n * .45, t.add(i)
    }
    t.add(hd(-.66, .66, .34, .012, e.chrome, .002)), t.add(hd(-.5, .5, .3, .008, e.chrome, .002));
    let n = pd(1.5, .03, .12, .014, e.goldPaint);
    n.position.set(0, 1.99, 2.64), t.add(n);
    let r = new q(new Ka(.48, .15), new lo({
        map: wd(),
        roughness: .35,
        metalness: .1
    }));
    return r.position.set(0, .6, 2.711), t.add(r), t
}

function Od() {
    let e = document.createElement(`canvas`);
    e.width = 256, e.height = 256;
    let t = e.getContext(`2d`);
    if (t) {
        let e = t.createRadialGradient(128, 128, 0, 128, 128, 128);
        e.addColorStop(0, `rgba(226,214,193,1)`), e.addColorStop(.28, `rgba(226,214,193,1)`), e.addColorStop(.34, `rgba(150,140,125,0.9)`), e.addColorStop(.85, `rgba(120,112,100,0.75)`), e.addColorStop(.93, `rgba(240,240,240,1)`), e.addColorStop(1, `rgba(240,240,240,0)`), t.fillStyle = e, t.fillRect(0, 0, 256, 256)
    }
    let n = new xi(e);
    return n.colorSpace = Re, new lo({
        map: n,
        metalness: .85,
        roughness: .35,
        transparent: !0,
        opacity: 0,
        depthWrite: !1
    })
}

function kd(e, t, n) {
    let r = new Tn,
        i = new Tn;
    r.add(i);
    let a = Ju / .4,
        o = new Ga([
            [.285, -.118],
            [.33, -.13],
            [.365, -.132],
            [.388, -.122],
            [.398, -.104],
            [.402, -.08],
            [.403, 0],
            [.402, .08],
            [.398, .104],
            [.388, .122],
            [.365, .132],
            [.33, .13],
            [.285, .118]
        ].map(([e, t]) => new H(e * a, t)), 72);
    o.rotateZ(Math.PI / 2);
    let s = new q(o, e.rubber);
    i.add(s);
    let c = new Za(.403 * a, .004, 4, 96);
    c.rotateY(Math.PI / 2);
    for (let t of [-.05, 0, .05]) {
        let n = new q(c, e.trimBlack);
        n.position.x = t, n.scale.setScalar(.999), i.add(n)
    }
    let l = .285 * a,
        u = .1,
        d = new q(new Za(.2952499999999999, .014, 12, 64), e.chrome);
    d.rotation.y = Math.PI / 2, d.position.x = u, i.add(d);
    let f = new q(new Di(l, l, .22, 48, 1, !0), e.darkMetal);
    f.rotation.z = Math.PI / 2, i.add(f);
    let p = new q(new qa(.08, .2892499999999999, 64), e.darkMetal);
    p.rotation.y = Math.PI / 2, p.position.x = .05500000000000001, i.add(p);
    for (let t = 0; t < 18; t++) {
        let n = t / 18 * Math.PI * 2,
            r = new q(new Ti(.018, .2092499999999999, .026), e.satinGold),
            a = .18962499999999996;
        r.position.set(.08800000000000001, Math.cos(n) * a, Math.sin(n) * a), r.rotation.x = n, i.add(r);
        let o = r.clone();
        o.position.set(.08, Math.cos(n + .09) * a, Math.sin(n + .09) * a), o.rotation.x = n + .09, o.scale.set(.8, 1, .6), i.add(o)
    }
    let m = new q(new Ei(.3032499999999999, 48), n);
    m.rotation.y = Math.PI / 2, m.position.x = .10200000000000001, m.renderOrder = 2, i.add(m);
    let h = new q(new Di(.08, .09, .05, 40), e.satinGold);
    h.rotation.z = Math.PI / 2, h.position.x = u, i.add(h);
    for (let t = 0; t < 5; t++) {
        let n = t / 5 * Math.PI * 2,
            r = new q(new Di(.011, .011, .02, 6), e.chrome);
        r.rotation.z = Math.PI / 2, r.position.set(.13, Math.cos(n) * .055, Math.sin(n) * .055), i.add(r)
    }
    let g = new q(new Di(.035, .035, .01, 32), e.trimBlack);
    g.rotation.z = Math.PI / 2, g.position.x = .13, i.add(g);
    let _ = new q(new Di(.22, .22, .03, 48), e.brakeDisc);
    _.rotation.z = Math.PI / 2, _.position.x = 0, i.add(_);
    let v = new q(new Di(.1, .1, .04, 32), e.darkMetal);
    v.rotation.z = Math.PI / 2, v.position.x = .02, i.add(v);
    let y = pd(.07, .17, .12, .03, e.caliper);
    return y.position.set(.02, .15, t ? .12 : -.12), y.rotation.x = t ? .6 : -.6, r.add(y), r.traverse(e => {
        e instanceof q && (e.castShadow = !0)
    }), {
        holder: r,
        spin: i,
        front: t
    }
}

function Ad(e) {
    let t = document.createElement(`canvas`);
    t.width = 128, t.height = 256;
    let n = t.getContext(`2d`);
    if (n) {
        let e = n.createRadialGradient(64, 128, 10, 64, 128, 128);
        e.addColorStop(0, `rgba(0,0,0,0.9)`), e.addColorStop(.55, `rgba(0,0,0,0.5)`), e.addColorStop(1, `rgba(0,0,0,0)`), n.fillStyle = e, n.fillRect(0, 0, 128, 256)
    }
    let r = e.shadow.clone();
    r.map = new xi(t), r.color.set(16777215);
    let i = new q(new Ka(2.6, 6.2), r);
    return i.rotation.x = -Math.PI / 2, i.position.y = .012, i.renderOrder = -1, i
}

function jd(e) {
    let t = new U(0, 1.12, -1.3),
        n = new U(0, 1.79, -.56).clone().sub(t),
        r = n.length(),
        i = new U(0, n.z, -n.y).normalize(),
        a = new ia;
    a.moveTo(-.82, 0), a.lineTo(.82, 0), a.quadraticCurveTo(.86, 0, .855, .05), a.lineTo(.76, r - .06), a.quadraticCurveTo(.75, r, .68, r), a.lineTo(-.68, r), a.quadraticCurveTo(-.75, r, -.76, r - .06), a.lineTo(-.855, .05), a.quadraticCurveTo(-.86, 0, -.82, 0);
    let o = new q(new Ja(a, 16), e.glass);
    return o.position.copy(t).addScaledVector(i, .088), o.up.copy(n).normalize(), o.lookAt(o.position.clone().add(i)), o
}

function Md() {
    let e = Hu(),
        t = new Tn,
        n = new Tn;
    t.add(n), n.add(new q(ud(yd(), {
        width: Uu,
        bevel: Gu,
        steps: 18
    }), e.blackPaint)), n.add(new q(ud(bd(), {
        width: 1.95,
        bevel: .07,
        steps: 18
    }), e.goldPaint)), n.add(new q(ud(xd(), {
        width: Ku,
        bevel: Gu,
        steps: 16,
        tumblehome: !0
    }), e.goldPaint)), n.add(jd(e));
    let r = new q(new Bu(1.18, .01, 2.1, 3, .004), e.glass);
    r.position.set(0, 2.022, .8), n.add(r);
    for (let t of [-1, 1]) n.add(dd([new U(t * .66, 2, -.35), new U(t * .67, 2.035, -.1), new U(t * .67, 2.035, 2.1), new U(t * .66, 2, 2.4)], .013, e.chrome));
    let i = new q(new Xa(1, 20, 12), e.blackPaint);
    i.scale.set(.035, .04, .12), i.position.set(0, 2.03, 2.3), n.add(i);
    let a = Td(e),
        o = Td(e);
    o.scale.x = -1, n.add(a, o), n.add(Ed(e)), n.add(Dd(e));
    for (let t of [Xu, Zu]) {
        let r = new q(new Ti(1.5, .6, 1.1), e.trimBlack);
        r.position.set(0, .62, t), n.add(r)
    }
    let s = new q(new Ti(1.8, .06, 5), e.trimBlack);
    s.position.set(0, .2, 0), n.add(s), n.traverse(e => {
        e instanceof q && (e.castShadow = !0, e.receiveShadow = !0)
    }), t.add(Ad(e));
    let c = [],
        l = Od();
    for (let [n, r] of [
            [Xu, !0],
            [Zu, !1]
        ])
        for (let i of [-1, 1]) {
            let a = kd(e, r, l);
            a.holder.position.set(i * Yu, Ju, n), i < 0 && (a.holder.scale.x = -1), t.add(a.holder), c.push(a)
        }
    return {
        root: t,
        body: n,
        wheels: c,
        materials: e,
        setBrakeHeat(t) {
            e.brakeDisc.emissiveIntensity = Math.max(0, t) * 2.6
        },
        setBrakeLights(t) {
            e.taillight.emissiveIntensity = t
        },
        spinWheels(e, t) {
            let n = e / Ju,
                r = t > 0 ? Math.abs(n) / t : 0,
                i = Math.sign(n) * Math.min(Math.abs(n), .12);
            for (let e of c) e.spin.rotation.x -= i;
            let a = id(10, 45, r) * .92;
            l.opacity += (a - l.opacity) * Math.min(1, t * 8)
        }
    }
}
var Nd = 3.6,
    Pd = {
        car: {
            massKg: 2800,
            maxSpeedKmh: 260,
            launchAccel: 7.4,
            accelFalloffExp: 1.55,
            wheelRadius: .4
        },
        brake: {
            minSpeedKmh: 100,
            breakForceN: 1612,
            rampBase: 200,
            rampGrowth: 400,
            releaseRate: 900,
            decelPerNewton: 10.8 / 1612,
            rollingDecel: .15,
            dragCoeff: 22e-5,
            stopSpeed: .08
        },
        track: {
            barrierDistance: 2600,
            roadWidth: 14,
            laneWidth: 3.6
        },
        crash: {
            slowMoScale: .28,
            slowMoSeconds: 1.6,
            resultDelaySeconds: 5.5
        },
        leaderboard: {
            limit: 50,
            nicknameMax: 12
        }
    };

function Fd(e, t) {
    return t <= 0 ? 0 : Math.round(e * e / t)
}
var Id = class e {
        constructor(e) {
            e === void 0 && (e = [0, 0, 0, 0, 0, 0, 0, 0, 0]), this.elements = e
        }
        identity() {
            let e = this.elements;
            e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 1, e[5] = 0, e[6] = 0, e[7] = 0, e[8] = 1
        }
        setZero() {
            let e = this.elements;
            e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 0, e[6] = 0, e[7] = 0, e[8] = 0
        }
        setTrace(e) {
            let t = this.elements;
            t[0] = e.x, t[4] = e.y, t[8] = e.z
        }
        getTrace(e) {
            e === void 0 && (e = new X);
            let t = this.elements;
            return e.x = t[0], e.y = t[4], e.z = t[8], e
        }
        vmult(e, t) {
            t === void 0 && (t = new X);
            let n = this.elements,
                r = e.x,
                i = e.y,
                a = e.z;
            return t.x = n[0] * r + n[1] * i + n[2] * a, t.y = n[3] * r + n[4] * i + n[5] * a, t.z = n[6] * r + n[7] * i + n[8] * a, t
        }
        smult(e) {
            for (let t = 0; t < this.elements.length; t++) this.elements[t] *= e
        }
        mmult(t, n) {
            n === void 0 && (n = new e);
            let r = this.elements,
                i = t.elements,
                a = n.elements,
                o = r[0],
                s = r[1],
                c = r[2],
                l = r[3],
                u = r[4],
                d = r[5],
                f = r[6],
                p = r[7],
                m = r[8],
                h = i[0],
                g = i[1],
                _ = i[2],
                v = i[3],
                y = i[4],
                b = i[5],
                x = i[6],
                S = i[7],
                C = i[8];
            return a[0] = o * h + s * v + c * x, a[1] = o * g + s * y + c * S, a[2] = o * _ + s * b + c * C, a[3] = l * h + u * v + d * x, a[4] = l * g + u * y + d * S, a[5] = l * _ + u * b + d * C, a[6] = f * h + p * v + m * x, a[7] = f * g + p * y + m * S, a[8] = f * _ + p * b + m * C, n
        }
        scale(t, n) {
            n === void 0 && (n = new e);
            let r = this.elements,
                i = n.elements;
            for (let e = 0; e !== 3; e++) i[3 * e + 0] = t.x * r[3 * e + 0], i[3 * e + 1] = t.y * r[3 * e + 1], i[3 * e + 2] = t.z * r[3 * e + 2];
            return n
        }
        solve(e, t) {
            t === void 0 && (t = new X);
            let n = [],
                r, i;
            for (r = 0; r < 12; r++) n.push(0);
            for (r = 0; r < 3; r++)
                for (i = 0; i < 3; i++) n[r + 4 * i] = this.elements[r + 3 * i];
            n[3] = e.x, n[7] = e.y, n[11] = e.z;
            let a = 3,
                o = a,
                s, c;
            do {
                if (r = o - a, n[r + 4 * r] === 0) {
                    for (i = r + 1; i < o; i++)
                        if (n[r + 4 * i] !== 0) {
                            s = 4;
                            do c = 4 - s, n[c + 4 * r] += n[c + 4 * i]; while (--s);
                            break
                        }
                }
                if (n[r + 4 * r] !== 0)
                    for (i = r + 1; i < o; i++) {
                        let e = n[r + 4 * i] / n[r + 4 * r];
                        s = 4;
                        do c = 4 - s, n[c + 4 * i] = c <= r ? 0 : n[c + 4 * i] - n[c + 4 * r] * e; while (--s)
                    }
            } while (--a);
            if (t.z = n[11] / n[10], t.y = (n[7] - n[6] * t.z) / n[5], t.x = (n[3] - n[2] * t.z - n[1] * t.y) / n[0], isNaN(t.x) || isNaN(t.y) || isNaN(t.z) || t.x === 1 / 0 || t.y === 1 / 0 || t.z === 1 / 0) throw `Could not solve equation! Got x=[${t.toString()}], b=[${e.toString()}], A=[${this.toString()}]`;
            return t
        }
        e(e, t, n) {
            if (n === void 0) return this.elements[t + 3 * e];
            this.elements[t + 3 * e] = n
        }
        copy(e) {
            for (let t = 0; t < e.elements.length; t++) this.elements[t] = e.elements[t];
            return this
        }
        toString() {
            let e = ``;
            for (let t = 0; t < 9; t++) e += this.elements[t] + `,`;
            return e
        }
        reverse(t) {
            t === void 0 && (t = new e);
            let n = Ld,
                r, i;
            for (r = 0; r < 3; r++)
                for (i = 0; i < 3; i++) n[r + 6 * i] = this.elements[r + 3 * i];
            n[3] = 1, n[9] = 0, n[15] = 0, n[4] = 0, n[10] = 1, n[16] = 0, n[5] = 0, n[11] = 0, n[17] = 1;
            let a = 3,
                o = a,
                s, c;
            do {
                if (r = o - a, n[r + 6 * r] === 0) {
                    for (i = r + 1; i < o; i++)
                        if (n[r + 6 * i] !== 0) {
                            s = 6;
                            do c = 6 - s, n[c + 6 * r] += n[c + 6 * i]; while (--s);
                            break
                        }
                }
                if (n[r + 6 * r] !== 0)
                    for (i = r + 1; i < o; i++) {
                        let e = n[r + 6 * i] / n[r + 6 * r];
                        s = 6;
                        do c = 6 - s, n[c + 6 * i] = c <= r ? 0 : n[c + 6 * i] - n[c + 6 * r] * e; while (--s)
                    }
            } while (--a);
            r = 2;
            do {
                i = r - 1;
                do {
                    let e = n[r + 6 * i] / n[r + 6 * r];
                    s = 6;
                    do c = 6 - s, n[c + 6 * i] = n[c + 6 * i] - n[c + 6 * r] * e; while (--s)
                } while (i--)
            } while (--r);
            r = 2;
            do {
                let e = 1 / n[r + 6 * r];
                s = 6;
                do c = 6 - s, n[c + 6 * r] = n[c + 6 * r] * e; while (--s)
            } while (r--);
            r = 2;
            do {
                i = 2;
                do {
                    if (c = n[3 + i + 6 * r], isNaN(c) || c === 1 / 0) throw `Could not reverse! A=[${this.toString()}]`;
                    t.e(r, i, c)
                } while (i--)
            } while (r--);
            return t
        }
        setRotationFromQuaternion(e) {
            let t = e.x,
                n = e.y,
                r = e.z,
                i = e.w,
                a = t + t,
                o = n + n,
                s = r + r,
                c = t * a,
                l = t * o,
                u = t * s,
                d = n * o,
                f = n * s,
                p = r * s,
                m = i * a,
                h = i * o,
                g = i * s,
                _ = this.elements;
            return _[0] = 1 - (d + p), _[1] = l - g, _[2] = u + h, _[3] = l + g, _[4] = 1 - (c + p), _[5] = f - m, _[6] = u - h, _[7] = f + m, _[8] = 1 - (c + d), this
        }
        transpose(t) {
            t === void 0 && (t = new e);
            let n = this.elements,
                r = t.elements,
                i;
            return r[0] = n[0], r[4] = n[4], r[8] = n[8], i = n[1], r[1] = n[3], r[3] = i, i = n[2], r[2] = n[6], r[6] = i, i = n[5], r[5] = n[7], r[7] = i, t
        }
    },
    Ld = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    X = class e {
        constructor(e, t, n) {
            e === void 0 && (e = 0), t === void 0 && (t = 0), n === void 0 && (n = 0), this.x = e, this.y = t, this.z = n
        }
        cross(t, n) {
            n === void 0 && (n = new e);
            let r = t.x,
                i = t.y,
                a = t.z,
                o = this.x,
                s = this.y,
                c = this.z;
            return n.x = s * a - c * i, n.y = c * r - o * a, n.z = o * i - s * r, n
        }
        set(e, t, n) {
            return this.x = e, this.y = t, this.z = n, this
        }
        setZero() {
            this.x = this.y = this.z = 0
        }
        vadd(t, n) {
            if (n) n.x = t.x + this.x, n.y = t.y + this.y, n.z = t.z + this.z;
            else return new e(this.x + t.x, this.y + t.y, this.z + t.z)
        }
        vsub(t, n) {
            if (n) n.x = this.x - t.x, n.y = this.y - t.y, n.z = this.z - t.z;
            else return new e(this.x - t.x, this.y - t.y, this.z - t.z)
        }
        crossmat() {
            return new Id([0, -this.z, this.y, this.z, 0, -this.x, -this.y, this.x, 0])
        }
        normalize() {
            let e = this.x,
                t = this.y,
                n = this.z,
                r = Math.sqrt(e * e + t * t + n * n);
            if (r > 0) {
                let e = 1 / r;
                this.x *= e, this.y *= e, this.z *= e
            } else this.x = 0, this.y = 0, this.z = 0;
            return r
        }
        unit(t) {
            t === void 0 && (t = new e);
            let n = this.x,
                r = this.y,
                i = this.z,
                a = Math.sqrt(n * n + r * r + i * i);
            return a > 0 ? (a = 1 / a, t.x = n * a, t.y = r * a, t.z = i * a) : (t.x = 1, t.y = 0, t.z = 0), t
        }
        length() {
            let e = this.x,
                t = this.y,
                n = this.z;
            return Math.sqrt(e * e + t * t + n * n)
        }
        lengthSquared() {
            return this.dot(this)
        }
        distanceTo(e) {
            let t = this.x,
                n = this.y,
                r = this.z,
                i = e.x,
                a = e.y,
                o = e.z;
            return Math.sqrt((i - t) * (i - t) + (a - n) * (a - n) + (o - r) * (o - r))
        }
        distanceSquared(e) {
            let t = this.x,
                n = this.y,
                r = this.z,
                i = e.x,
                a = e.y,
                o = e.z;
            return (i - t) * (i - t) + (a - n) * (a - n) + (o - r) * (o - r)
        }
        scale(t, n) {
            n === void 0 && (n = new e);
            let r = this.x,
                i = this.y,
                a = this.z;
            return n.x = t * r, n.y = t * i, n.z = t * a, n
        }
        vmul(t, n) {
            return n === void 0 && (n = new e), n.x = t.x * this.x, n.y = t.y * this.y, n.z = t.z * this.z, n
        }
        addScaledVector(t, n, r) {
            return r === void 0 && (r = new e), r.x = this.x + t * n.x, r.y = this.y + t * n.y, r.z = this.z + t * n.z, r
        }
        dot(e) {
            return this.x * e.x + this.y * e.y + this.z * e.z
        }
        isZero() {
            return this.x === 0 && this.y === 0 && this.z === 0
        }
        negate(t) {
            return t === void 0 && (t = new e), t.x = -this.x, t.y = -this.y, t.z = -this.z, t
        }
        tangents(e, t) {
            let n = this.length();
            if (n > 0) {
                let r = Rd,
                    i = 1 / n;
                r.set(this.x * i, this.y * i, this.z * i);
                let a = zd;
                Math.abs(r.x) < .9 ? (a.set(1, 0, 0), r.cross(a, e)) : (a.set(0, 1, 0), r.cross(a, e)), r.cross(e, t)
            } else e.set(1, 0, 0), t.set(0, 1, 0)
        }
        toString() {
            return `${this.x},${this.y},${this.z}`
        }
        toArray() {
            return [this.x, this.y, this.z]
        }
        copy(e) {
            return this.x = e.x, this.y = e.y, this.z = e.z, this
        }
        lerp(e, t, n) {
            let r = this.x,
                i = this.y,
                a = this.z;
            n.x = r + (e.x - r) * t, n.y = i + (e.y - i) * t, n.z = a + (e.z - a) * t
        }
        almostEquals(e, t) {
            return t === void 0 && (t = 1e-6), !(Math.abs(this.x - e.x) > t || Math.abs(this.y - e.y) > t || Math.abs(this.z - e.z) > t)
        }
        almostZero(e) {
            return e === void 0 && (e = 1e-6), !(Math.abs(this.x) > e || Math.abs(this.y) > e || Math.abs(this.z) > e)
        }
        isAntiparallelTo(e, t) {
            return this.negate(Bd), Bd.almostEquals(e, t)
        }
        clone() {
            return new e(this.x, this.y, this.z)
        }
    };
X.ZERO = new X(0, 0, 0), X.UNIT_X = new X(1, 0, 0), X.UNIT_Y = new X(0, 1, 0), X.UNIT_Z = new X(0, 0, 1);
var Rd = new X,
    zd = new X,
    Bd = new X,
    Vd = class e {
        constructor(e) {
            e === void 0 && (e = {}), this.lowerBound = new X, this.upperBound = new X, e.lowerBound && this.lowerBound.copy(e.lowerBound), e.upperBound && this.upperBound.copy(e.upperBound)
        }
        setFromPoints(e, t, n, r) {
            let i = this.lowerBound,
                a = this.upperBound,
                o = n;
            i.copy(e[0]), o && o.vmult(i, i), a.copy(i);
            for (let t = 1; t < e.length; t++) {
                let n = e[t];
                o && (o.vmult(n, Hd), n = Hd), n.x > a.x && (a.x = n.x), n.x < i.x && (i.x = n.x), n.y > a.y && (a.y = n.y), n.y < i.y && (i.y = n.y), n.z > a.z && (a.z = n.z), n.z < i.z && (i.z = n.z)
            }
            return t && (t.vadd(i, i), t.vadd(a, a)), r && (i.x -= r, i.y -= r, i.z -= r, a.x += r, a.y += r, a.z += r), this
        }
        copy(e) {
            return this.lowerBound.copy(e.lowerBound), this.upperBound.copy(e.upperBound), this
        }
        clone() {
            return new e().copy(this)
        }
        extend(e) {
            this.lowerBound.x = Math.min(this.lowerBound.x, e.lowerBound.x), this.upperBound.x = Math.max(this.upperBound.x, e.upperBound.x), this.lowerBound.y = Math.min(this.lowerBound.y, e.lowerBound.y), this.upperBound.y = Math.max(this.upperBound.y, e.upperBound.y), this.lowerBound.z = Math.min(this.lowerBound.z, e.lowerBound.z), this.upperBound.z = Math.max(this.upperBound.z, e.upperBound.z)
        }
        overlaps(e) {
            let t = this.lowerBound,
                n = this.upperBound,
                r = e.lowerBound,
                i = e.upperBound,
                a = r.x <= n.x && n.x <= i.x || t.x <= i.x && i.x <= n.x,
                o = r.y <= n.y && n.y <= i.y || t.y <= i.y && i.y <= n.y,
                s = r.z <= n.z && n.z <= i.z || t.z <= i.z && i.z <= n.z;
            return a && o && s
        }
        volume() {
            let e = this.lowerBound,
                t = this.upperBound;
            return (t.x - e.x) * (t.y - e.y) * (t.z - e.z)
        }
        contains(e) {
            let t = this.lowerBound,
                n = this.upperBound,
                r = e.lowerBound,
                i = e.upperBound;
            return t.x <= r.x && n.x >= i.x && t.y <= r.y && n.y >= i.y && t.z <= r.z && n.z >= i.z
        }
        getCorners(e, t, n, r, i, a, o, s) {
            let c = this.lowerBound,
                l = this.upperBound;
            e.copy(c), t.set(l.x, c.y, c.z), n.set(l.x, l.y, c.z), r.set(c.x, l.y, l.z), i.set(l.x, c.y, l.z), a.set(c.x, l.y, c.z), o.set(c.x, c.y, l.z), s.copy(l)
        }
        toLocalFrame(e, t) {
            let n = Ud,
                r = n[0],
                i = n[1],
                a = n[2],
                o = n[3],
                s = n[4],
                c = n[5],
                l = n[6],
                u = n[7];
            this.getCorners(r, i, a, o, s, c, l, u);
            for (let t = 0; t !== 8; t++) {
                let r = n[t];
                e.pointToLocal(r, r)
            }
            return t.setFromPoints(n)
        }
        toWorldFrame(e, t) {
            let n = Ud,
                r = n[0],
                i = n[1],
                a = n[2],
                o = n[3],
                s = n[4],
                c = n[5],
                l = n[6],
                u = n[7];
            this.getCorners(r, i, a, o, s, c, l, u);
            for (let t = 0; t !== 8; t++) {
                let r = n[t];
                e.pointToWorld(r, r)
            }
            return t.setFromPoints(n)
        }
        overlapsRay(e) {
            let {
                direction: t,
                from: n
            } = e, r = 1 / t.x, i = 1 / t.y, a = 1 / t.z, o = (this.lowerBound.x - n.x) * r, s = (this.upperBound.x - n.x) * r, c = (this.lowerBound.y - n.y) * i, l = (this.upperBound.y - n.y) * i, u = (this.lowerBound.z - n.z) * a, d = (this.upperBound.z - n.z) * a, f = Math.max(Math.max(Math.min(o, s), Math.min(c, l)), Math.min(u, d)), p = Math.min(Math.min(Math.max(o, s), Math.max(c, l)), Math.max(u, d));
            return !(p < 0 || f > p)
        }
    },
    Hd = new X,
    Ud = [new X, new X, new X, new X, new X, new X, new X, new X],
    Wd = class {
        constructor() {
            this.matrix = []
        }
        get(e, t) {
            let {
                index: n
            } = e, {
                index: r
            } = t;
            if (r > n) {
                let e = r;
                r = n, n = e
            }
            return this.matrix[(n * (n + 1) >> 1) + r - 1]
        }
        set(e, t, n) {
            let {
                index: r
            } = e, {
                index: i
            } = t;
            if (i > r) {
                let e = i;
                i = r, r = e
            }
            this.matrix[(r * (r + 1) >> 1) + i - 1] = +!!n
        }
        reset() {
            for (let e = 0, t = this.matrix.length; e !== t; e++) this.matrix[e] = 0
        }
        setNumObjects(e) {
            this.matrix.length = e * (e - 1) >> 1
        }
    },
    Gd = class {
        addEventListener(e, t) {
            this._listeners === void 0 && (this._listeners = {});
            let n = this._listeners;
            return n[e] === void 0 && (n[e] = []), n[e].includes(t) || n[e].push(t), this
        }
        hasEventListener(e, t) {
            if (this._listeners === void 0) return !1;
            let n = this._listeners;
            return !!(n[e] !== void 0 && n[e].includes(t))
        }
        hasAnyEventListener(e) {
            return this._listeners !== void 0 && this._listeners[e] !== void 0
        }
        removeEventListener(e, t) {
            if (this._listeners === void 0) return this;
            let n = this._listeners;
            if (n[e] === void 0) return this;
            let r = n[e].indexOf(t);
            return r !== -1 && n[e].splice(r, 1), this
        }
        dispatchEvent(e) {
            if (this._listeners === void 0) return this;
            let t = this._listeners[e.type];
            if (t !== void 0) {
                e.target = this;
                for (let n = 0, r = t.length; n < r; n++) t[n].call(this, e)
            }
            return this
        }
    },
    Kd = class e {
        constructor(e, t, n, r) {
            e === void 0 && (e = 0), t === void 0 && (t = 0), n === void 0 && (n = 0), r === void 0 && (r = 1), this.x = e, this.y = t, this.z = n, this.w = r
        }
        set(e, t, n, r) {
            return this.x = e, this.y = t, this.z = n, this.w = r, this
        }
        toString() {
            return `${this.x},${this.y},${this.z},${this.w}`
        }
        toArray() {
            return [this.x, this.y, this.z, this.w]
        }
        setFromAxisAngle(e, t) {
            let n = Math.sin(t * .5);
            return this.x = e.x * n, this.y = e.y * n, this.z = e.z * n, this.w = Math.cos(t * .5), this
        }
        toAxisAngle(e) {
            e === void 0 && (e = new X), this.normalize();
            let t = 2 * Math.acos(this.w),
                n = Math.sqrt(1 - this.w * this.w);
            return n < .001 ? (e.x = this.x, e.y = this.y, e.z = this.z) : (e.x = this.x / n, e.y = this.y / n, e.z = this.z / n), [e, t]
        }
        setFromVectors(e, t) {
            if (e.isAntiparallelTo(t)) {
                let t = qd,
                    n = Jd;
                e.tangents(t, n), this.setFromAxisAngle(t, Math.PI)
            } else {
                let n = e.cross(t);
                this.x = n.x, this.y = n.y, this.z = n.z, this.w = Math.sqrt(e.length() ** 2 * t.length() ** 2) + e.dot(t), this.normalize()
            }
            return this
        }
        mult(t, n) {
            n === void 0 && (n = new e);
            let r = this.x,
                i = this.y,
                a = this.z,
                o = this.w,
                s = t.x,
                c = t.y,
                l = t.z,
                u = t.w;
            return n.x = r * u + o * s + i * l - a * c, n.y = i * u + o * c + a * s - r * l, n.z = a * u + o * l + r * c - i * s, n.w = o * u - r * s - i * c - a * l, n
        }
        inverse(t) {
            t === void 0 && (t = new e);
            let n = this.x,
                r = this.y,
                i = this.z,
                a = this.w;
            this.conjugate(t);
            let o = 1 / (n * n + r * r + i * i + a * a);
            return t.x *= o, t.y *= o, t.z *= o, t.w *= o, t
        }
        conjugate(t) {
            return t === void 0 && (t = new e), t.x = -this.x, t.y = -this.y, t.z = -this.z, t.w = this.w, t
        }
        normalize() {
            let e = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
            return e === 0 ? (this.x = 0, this.y = 0, this.z = 0, this.w = 0) : (e = 1 / e, this.x *= e, this.y *= e, this.z *= e, this.w *= e), this
        }
        normalizeFast() {
            let e = (3 - (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)) / 2;
            return e === 0 ? (this.x = 0, this.y = 0, this.z = 0, this.w = 0) : (this.x *= e, this.y *= e, this.z *= e, this.w *= e), this
        }
        vmult(e, t) {
            t === void 0 && (t = new X);
            let n = e.x,
                r = e.y,
                i = e.z,
                a = this.x,
                o = this.y,
                s = this.z,
                c = this.w,
                l = c * n + o * i - s * r,
                u = c * r + s * n - a * i,
                d = c * i + a * r - o * n,
                f = -a * n - o * r - s * i;
            return t.x = l * c + f * -a + u * -s - d * -o, t.y = u * c + f * -o + d * -a - l * -s, t.z = d * c + f * -s + l * -o - u * -a, t
        }
        copy(e) {
            return this.x = e.x, this.y = e.y, this.z = e.z, this.w = e.w, this
        }
        toEuler(e, t) {
            t === void 0 && (t = `YZX`);
            let n, r, i, a = this.x,
                o = this.y,
                s = this.z,
                c = this.w;
            switch (t) {
                case `YZX`:
                    let e = a * o + s * c;
                    if (e > .499 && (n = 2 * Math.atan2(a, c), r = Math.PI / 2, i = 0), e < -.499 && (n = -2 * Math.atan2(a, c), r = -Math.PI / 2, i = 0), n === void 0) {
                        let t = a * a,
                            l = o * o,
                            u = s * s;
                        n = Math.atan2(2 * o * c - 2 * a * s, 1 - 2 * l - 2 * u), r = Math.asin(2 * e), i = Math.atan2(2 * a * c - 2 * o * s, 1 - 2 * t - 2 * u)
                    }
                    break;
                default:
                    throw Error(`Euler order ${t} not supported yet.`)
            }
            e.y = n, e.z = r, e.x = i
        }
        setFromEuler(e, t, n, r) {
            r === void 0 && (r = `XYZ`);
            let i = Math.cos(e / 2),
                a = Math.cos(t / 2),
                o = Math.cos(n / 2),
                s = Math.sin(e / 2),
                c = Math.sin(t / 2),
                l = Math.sin(n / 2);
            return r === `XYZ` ? (this.x = s * a * o + i * c * l, this.y = i * c * o - s * a * l, this.z = i * a * l + s * c * o, this.w = i * a * o - s * c * l) : r === `YXZ` ? (this.x = s * a * o + i * c * l, this.y = i * c * o - s * a * l, this.z = i * a * l - s * c * o, this.w = i * a * o + s * c * l) : r === `ZXY` ? (this.x = s * a * o - i * c * l, this.y = i * c * o + s * a * l, this.z = i * a * l + s * c * o, this.w = i * a * o - s * c * l) : r === `ZYX` ? (this.x = s * a * o - i * c * l, this.y = i * c * o + s * a * l, this.z = i * a * l - s * c * o, this.w = i * a * o + s * c * l) : r === `YZX` ? (this.x = s * a * o + i * c * l, this.y = i * c * o + s * a * l, this.z = i * a * l - s * c * o, this.w = i * a * o - s * c * l) : r === `XZY` && (this.x = s * a * o - i * c * l, this.y = i * c * o - s * a * l, this.z = i * a * l + s * c * o, this.w = i * a * o + s * c * l), this
        }
        clone() {
            return new e(this.x, this.y, this.z, this.w)
        }
        slerp(t, n, r) {
            r === void 0 && (r = new e);
            let i = this.x,
                a = this.y,
                o = this.z,
                s = this.w,
                c = t.x,
                l = t.y,
                u = t.z,
                d = t.w,
                f, p, m, h, g;
            return p = i * c + a * l + o * u + s * d, p < 0 && (p = -p, c = -c, l = -l, u = -u, d = -d), 1 - p > 1e-6 ? (f = Math.acos(p), m = Math.sin(f), h = Math.sin((1 - n) * f) / m, g = Math.sin(n * f) / m) : (h = 1 - n, g = n), r.x = h * i + g * c, r.y = h * a + g * l, r.z = h * o + g * u, r.w = h * s + g * d, r
        }
        integrate(t, n, r, i) {
            i === void 0 && (i = new e);
            let a = t.x * r.x,
                o = t.y * r.y,
                s = t.z * r.z,
                c = this.x,
                l = this.y,
                u = this.z,
                d = this.w,
                f = n * .5;
            return i.x += f * (a * d + o * u - s * l), i.y += f * (o * d + s * c - a * u), i.z += f * (s * d + a * l - o * c), i.w += f * (-a * c - o * l - s * u), i
        }
    },
    qd = new X,
    Jd = new X,
    Yd = {
        SPHERE: 1,
        PLANE: 2,
        BOX: 4,
        COMPOUND: 8,
        CONVEXPOLYHEDRON: 16,
        HEIGHTFIELD: 32,
        PARTICLE: 64,
        CYLINDER: 128,
        TRIMESH: 256
    },
    Z = class e {
        constructor(t) {
            t === void 0 && (t = {}), this.id = e.idCounter++, this.type = t.type || 0, this.boundingSphereRadius = 0, this.collisionResponse = !t.collisionResponse || t.collisionResponse, this.collisionFilterGroup = t.collisionFilterGroup === void 0 ? 1 : t.collisionFilterGroup, this.collisionFilterMask = t.collisionFilterMask === void 0 ? -1 : t.collisionFilterMask, this.material = t.material ? t.material : null, this.body = null
        }
        updateBoundingSphereRadius() {
            throw `computeBoundingSphereRadius() not implemented for shape type ${this.type}`
        }
        volume() {
            throw `volume() not implemented for shape type ${this.type}`
        }
        calculateLocalInertia(e, t) {
            throw `calculateLocalInertia() not implemented for shape type ${this.type}`
        }
        calculateWorldAABB(e, t, n, r) {
            throw `calculateWorldAABB() not implemented for shape type ${this.type}`
        }
    };
Z.idCounter = 0, Z.types = Yd;
var Xd = class e {
        constructor(e) {
            e === void 0 && (e = {}), this.position = new X, this.quaternion = new Kd, e.position && this.position.copy(e.position), e.quaternion && this.quaternion.copy(e.quaternion)
        }
        pointToLocal(t, n) {
            return e.pointToLocalFrame(this.position, this.quaternion, t, n)
        }
        pointToWorld(t, n) {
            return e.pointToWorldFrame(this.position, this.quaternion, t, n)
        }
        vectorToWorldFrame(e, t) {
            return t === void 0 && (t = new X), this.quaternion.vmult(e, t), t
        }
        static pointToLocalFrame(e, t, n, r) {
            return r === void 0 && (r = new X), n.vsub(e, r), t.conjugate(Zd), Zd.vmult(r, r), r
        }
        static pointToWorldFrame(e, t, n, r) {
            return r === void 0 && (r = new X), t.vmult(n, r), r.vadd(e, r), r
        }
        static vectorToWorldFrame(e, t, n) {
            return n === void 0 && (n = new X), e.vmult(t, n), n
        }
        static vectorToLocalFrame(e, t, n, r) {
            return r === void 0 && (r = new X), t.w *= -1, t.vmult(n, r), t.w *= -1, r
        }
    },
    Zd = new Kd,
    Qd = class e extends Z {
        constructor(e) {
            e === void 0 && (e = {});
            let {
                vertices: t = [],
                faces: n = [],
                normals: r = [],
                axes: i,
                boundingSphereRadius: a
            } = e;
            super({
                type: Z.types.CONVEXPOLYHEDRON
            }), this.vertices = t, this.faces = n, this.faceNormals = r, this.faceNormals.length === 0 && this.computeNormals(), a ? this.boundingSphereRadius = a : this.updateBoundingSphereRadius(), this.worldVertices = [], this.worldVerticesNeedsUpdate = !0, this.worldFaceNormals = [], this.worldFaceNormalsNeedsUpdate = !0, this.uniqueAxes = i ? i.slice() : null, this.uniqueEdges = [], this.computeEdges()
        }
        computeEdges() {
            let e = this.faces,
                t = this.vertices,
                n = this.uniqueEdges;
            n.length = 0;
            let r = new X;
            for (let i = 0; i !== e.length; i++) {
                let a = e[i],
                    o = a.length;
                for (let e = 0; e !== o; e++) {
                    let i = (e + 1) % o;
                    t[a[e]].vsub(t[a[i]], r), r.normalize();
                    let s = !1;
                    for (let e = 0; e !== n.length; e++)
                        if (n[e].almostEquals(r) || n[e].almostEquals(r)) {
                            s = !0;
                            break
                        } s || n.push(r.clone())
                }
            }
        }
        computeNormals() {
            this.faceNormals.length = this.faces.length;
            for (let e = 0; e < this.faces.length; e++) {
                for (let t = 0; t < this.faces[e].length; t++)
                    if (!this.vertices[this.faces[e][t]]) throw Error(`Vertex ${this.faces[e][t]} not found!`);
                let t = this.faceNormals[e] || new X;
                this.getFaceNormal(e, t), t.negate(t), this.faceNormals[e] = t;
                let n = this.vertices[this.faces[e][0]];
                if (t.dot(n) < 0) {
                    console.error(`.faceNormals[${e}] = Vec3(${t.toString()}) looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.`);
                    for (let t = 0; t < this.faces[e].length; t++) console.warn(`.vertices[${this.faces[e][t]}] = Vec3(${this.vertices[this.faces[e][t]].toString()})`)
                }
            }
        }
        getFaceNormal(t, n) {
            let r = this.faces[t],
                i = this.vertices[r[0]],
                a = this.vertices[r[1]],
                o = this.vertices[r[2]];
            e.computeNormal(i, a, o, n)
        }
        static computeNormal(e, t, n, r) {
            let i = new X,
                a = new X;
            t.vsub(e, a), n.vsub(t, i), i.cross(a, r), r.isZero() || r.normalize()
        }
        clipAgainstHull(e, t, n, r, i, a, o, s, c) {
            let l = new X,
                u = -1,
                d = -Number.MAX_VALUE;
            for (let e = 0; e < n.faces.length; e++) {
                l.copy(n.faceNormals[e]), i.vmult(l, l);
                let t = l.dot(a);
                t > d && (d = t, u = e)
            }
            let f = [];
            for (let e = 0; e < n.faces[u].length; e++) {
                let t = n.vertices[n.faces[u][e]],
                    a = new X;
                a.copy(t), i.vmult(a, a), r.vadd(a, a), f.push(a)
            }
            u >= 0 && this.clipFaceAgainstHull(a, e, t, f, o, s, c)
        }
        findSeparatingAxis(e, t, n, r, i, a, o, s) {
            let c = new X,
                l = new X,
                u = new X,
                d = new X,
                f = new X,
                p = new X,
                m = Number.MAX_VALUE,
                h = this;
            if (h.uniqueAxes)
                for (let o = 0; o !== h.uniqueAxes.length; o++) {
                    n.vmult(h.uniqueAxes[o], c);
                    let s = h.testSepAxis(c, e, t, n, r, i);
                    if (s === !1) return !1;
                    s < m && (m = s, a.copy(c))
                } else {
                    let s = o ? o.length : h.faces.length;
                    for (let l = 0; l < s; l++) {
                        let s = o ? o[l] : l;
                        c.copy(h.faceNormals[s]), n.vmult(c, c);
                        let u = h.testSepAxis(c, e, t, n, r, i);
                        if (u === !1) return !1;
                        u < m && (m = u, a.copy(c))
                    }
                }
            if (e.uniqueAxes)
                for (let o = 0; o !== e.uniqueAxes.length; o++) {
                    i.vmult(e.uniqueAxes[o], l);
                    let s = h.testSepAxis(l, e, t, n, r, i);
                    if (s === !1) return !1;
                    s < m && (m = s, a.copy(l))
                } else {
                    let o = s ? s.length : e.faces.length;
                    for (let c = 0; c < o; c++) {
                        let o = s ? s[c] : c;
                        l.copy(e.faceNormals[o]), i.vmult(l, l);
                        let u = h.testSepAxis(l, e, t, n, r, i);
                        if (u === !1) return !1;
                        u < m && (m = u, a.copy(l))
                    }
                }
            for (let o = 0; o !== h.uniqueEdges.length; o++) {
                n.vmult(h.uniqueEdges[o], d);
                for (let o = 0; o !== e.uniqueEdges.length; o++)
                    if (i.vmult(e.uniqueEdges[o], f), d.cross(f, p), !p.almostZero()) {
                        p.normalize();
                        let o = h.testSepAxis(p, e, t, n, r, i);
                        if (o === !1) return !1;
                        o < m && (m = o, a.copy(p))
                    }
            }
            return r.vsub(t, u), u.dot(a) > 0 && a.negate(a), !0
        }
        testSepAxis(t, n, r, i, a, o) {
            let s = this;
            e.project(s, t, r, i, $d), e.project(n, t, a, o, ef);
            let c = $d[0],
                l = $d[1],
                u = ef[0],
                d = ef[1];
            if (c < d || u < l) return !1;
            let f = c - d,
                p = u - l;
            return f < p ? f : p
        }
        calculateLocalInertia(e, t) {
            let n = new X,
                r = new X;
            this.computeLocalAABB(r, n);
            let i = n.x - r.x,
                a = n.y - r.y,
                o = n.z - r.z;
            t.x = 1 / 12 * e * (2 * a * 2 * a + 2 * o * 2 * o), t.y = 1 / 12 * e * (2 * i * 2 * i + 2 * o * 2 * o), t.z = 1 / 12 * e * (2 * a * 2 * a + 2 * i * 2 * i)
        }
        getPlaneConstantOfFace(e) {
            let t = this.faces[e],
                n = this.faceNormals[e],
                r = this.vertices[t[0]];
            return -n.dot(r)
        }
        clipFaceAgainstHull(e, t, n, r, i, a, o) {
            let s = new X,
                c = new X,
                l = new X,
                u = new X,
                d = new X,
                f = new X,
                p = new X,
                m = new X,
                h = this,
                g = [],
                _ = r,
                v = g,
                y = -1,
                b = Number.MAX_VALUE;
            for (let t = 0; t < h.faces.length; t++) {
                s.copy(h.faceNormals[t]), n.vmult(s, s);
                let r = s.dot(e);
                r < b && (b = r, y = t)
            }
            if (y < 0) return;
            let x = h.faces[y];
            x.connectedFaces = [];
            for (let e = 0; e < h.faces.length; e++)
                for (let t = 0; t < h.faces[e].length; t++) x.indexOf(h.faces[e][t]) !== -1 && e !== y && x.connectedFaces.indexOf(e) === -1 && x.connectedFaces.push(e);
            let S = x.length;
            for (let e = 0; e < S; e++) {
                let r = h.vertices[x[e]],
                    i = h.vertices[x[(e + 1) % S]];
                r.vsub(i, c), l.copy(c), n.vmult(l, l), t.vadd(l, l), u.copy(this.faceNormals[y]), n.vmult(u, u), t.vadd(u, u), l.cross(u, d), d.negate(d), f.copy(r), n.vmult(f, f), t.vadd(f, f);
                let a = x.connectedFaces[e];
                p.copy(this.faceNormals[a]);
                let o = this.getPlaneConstantOfFace(a);
                m.copy(p), n.vmult(m, m);
                let s = o - m.dot(t);
                for (this.clipFaceAgainstPlane(_, v, m, s); _.length;) _.shift();
                for (; v.length;) _.push(v.shift())
            }
            p.copy(this.faceNormals[y]);
            let C = this.getPlaneConstantOfFace(y);
            m.copy(p), n.vmult(m, m);
            let w = C - m.dot(t);
            for (let e = 0; e < _.length; e++) {
                let t = m.dot(_[e]) + w;
                if (t <= i && (console.log(`clamped: depth=${t} to minDist=${i}`), t = i), t <= a) {
                    let n = _[e];
                    if (t <= 1e-6) {
                        let e = {
                            point: n,
                            normal: m,
                            depth: t
                        };
                        o.push(e)
                    }
                }
            }
        }
        clipFaceAgainstPlane(e, t, n, r) {
            let i, a, o = e.length;
            if (o < 2) return t;
            let s = e[e.length - 1],
                c = e[0];
            i = n.dot(s) + r;
            for (let l = 0; l < o; l++) {
                if (c = e[l], a = n.dot(c) + r, i < 0) {
                    if (a < 0) {
                        let e = new X;
                        e.copy(c), t.push(e)
                    } else {
                        let e = new X;
                        s.lerp(c, i / (i - a), e), t.push(e)
                    }
                } else if (a < 0) {
                    let e = new X;
                    s.lerp(c, i / (i - a), e), t.push(e), t.push(c)
                }
                s = c, i = a
            }
            return t
        }
        computeWorldVertices(e, t) {
            for (; this.worldVertices.length < this.vertices.length;) this.worldVertices.push(new X);
            let n = this.vertices,
                r = this.worldVertices;
            for (let i = 0; i !== this.vertices.length; i++) t.vmult(n[i], r[i]), e.vadd(r[i], r[i]);
            this.worldVerticesNeedsUpdate = !1
        }
        computeLocalAABB(e, t) {
            let n = this.vertices;
            e.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), t.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (let r = 0; r < this.vertices.length; r++) {
                let i = n[r];
                i.x < e.x ? e.x = i.x : i.x > t.x && (t.x = i.x), i.y < e.y ? e.y = i.y : i.y > t.y && (t.y = i.y), i.z < e.z ? e.z = i.z : i.z > t.z && (t.z = i.z)
            }
        }
        computeWorldFaceNormals(e) {
            let t = this.faceNormals.length;
            for (; this.worldFaceNormals.length < t;) this.worldFaceNormals.push(new X);
            let n = this.faceNormals,
                r = this.worldFaceNormals;
            for (let i = 0; i !== t; i++) e.vmult(n[i], r[i]);
            this.worldFaceNormalsNeedsUpdate = !1
        }
        updateBoundingSphereRadius() {
            let e = 0,
                t = this.vertices;
            for (let n = 0; n !== t.length; n++) {
                let r = t[n].lengthSquared();
                r > e && (e = r)
            }
            this.boundingSphereRadius = Math.sqrt(e)
        }
        calculateWorldAABB(e, t, n, r) {
            let i = this.vertices,
                a, o, s, c, l, u, d = new X;
            for (let n = 0; n < i.length; n++) {
                d.copy(i[n]), t.vmult(d, d), e.vadd(d, d);
                let r = d;
                (a === void 0 || r.x < a) && (a = r.x), (c === void 0 || r.x > c) && (c = r.x), (o === void 0 || r.y < o) && (o = r.y), (l === void 0 || r.y > l) && (l = r.y), (s === void 0 || r.z < s) && (s = r.z), (u === void 0 || r.z > u) && (u = r.z)
            }
            n.set(a, o, s), r.set(c, l, u)
        }
        volume() {
            return 4 * Math.PI * this.boundingSphereRadius / 3
        }
        getAveragePointLocal(e) {
            e === void 0 && (e = new X);
            let t = this.vertices;
            for (let n = 0; n < t.length; n++) e.vadd(t[n], e);
            return e.scale(1 / t.length, e), e
        }
        transformAllPoints(e, t) {
            let n = this.vertices.length,
                r = this.vertices;
            if (t) {
                for (let e = 0; e < n; e++) {
                    let n = r[e];
                    t.vmult(n, n)
                }
                for (let e = 0; e < this.faceNormals.length; e++) {
                    let n = this.faceNormals[e];
                    t.vmult(n, n)
                }
            }
            if (e)
                for (let t = 0; t < n; t++) {
                    let n = r[t];
                    n.vadd(e, n)
                }
        }
        pointIsInside(e) {
            let t = this.vertices,
                n = this.faces,
                r = this.faceNormals,
                i = new X;
            this.getAveragePointLocal(i);
            for (let a = 0; a < this.faces.length; a++) {
                let o = r[a],
                    s = t[n[a][0]],
                    c = new X;
                e.vsub(s, c);
                let l = o.dot(c),
                    u = new X;
                i.vsub(s, u);
                let d = o.dot(u);
                if (l < 0 && d > 0 || l > 0 && d < 0) return !1
            }
            return -1
        }
        static project(e, t, n, r, i) {
            let a = e.vertices.length,
                o = tf,
                s = 0,
                c = 0,
                l = nf,
                u = e.vertices;
            l.setZero(), Xd.vectorToLocalFrame(n, r, t, o), Xd.pointToLocalFrame(n, r, l, l);
            let d = l.dot(o);
            c = s = u[0].dot(o);
            for (let e = 1; e < a; e++) {
                let t = u[e].dot(o);
                t > s && (s = t), t < c && (c = t)
            }
            if (c -= d, s -= d, c > s) {
                let e = c;
                c = s, s = e
            }
            i[0] = s, i[1] = c
        }
    },
    $d = [],
    ef = [];
new X;
var tf = new X,
    nf = new X,
    rf = class e extends Z {
        constructor(e) {
            super({
                type: Z.types.BOX
            }), this.halfExtents = e, this.convexPolyhedronRepresentation = null, this.updateConvexPolyhedronRepresentation(), this.updateBoundingSphereRadius()
        }
        updateConvexPolyhedronRepresentation() {
            let e = this.halfExtents.x,
                t = this.halfExtents.y,
                n = this.halfExtents.z,
                r = X,
                i = new Qd({
                    vertices: [new r(-e, -t, -n), new r(e, -t, -n), new r(e, t, -n), new r(-e, t, -n), new r(-e, -t, n), new r(e, -t, n), new r(e, t, n), new r(-e, t, n)],
                    faces: [
                        [3, 2, 1, 0],
                        [4, 5, 6, 7],
                        [5, 4, 0, 1],
                        [2, 3, 7, 6],
                        [0, 4, 7, 3],
                        [1, 2, 6, 5]
                    ],
                    axes: [new r(0, 0, 1), new r(0, 1, 0), new r(1, 0, 0)]
                });
            this.convexPolyhedronRepresentation = i, i.material = this.material
        }
        calculateLocalInertia(t, n) {
            return n === void 0 && (n = new X), e.calculateInertia(this.halfExtents, t, n), n
        }
        static calculateInertia(e, t, n) {
            let r = e;
            n.x = 1 / 12 * t * (2 * r.y * 2 * r.y + 2 * r.z * 2 * r.z), n.y = 1 / 12 * t * (2 * r.x * 2 * r.x + 2 * r.z * 2 * r.z), n.z = 1 / 12 * t * (2 * r.y * 2 * r.y + 2 * r.x * 2 * r.x)
        }
        getSideNormals(e, t) {
            let n = e,
                r = this.halfExtents;
            if (n[0].set(r.x, 0, 0), n[1].set(0, r.y, 0), n[2].set(0, 0, r.z), n[3].set(-r.x, 0, 0), n[4].set(0, -r.y, 0), n[5].set(0, 0, -r.z), t !== void 0)
                for (let e = 0; e !== n.length; e++) t.vmult(n[e], n[e]);
            return n
        }
        volume() {
            return 8 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z
        }
        updateBoundingSphereRadius() {
            this.boundingSphereRadius = this.halfExtents.length()
        }
        forEachWorldCorner(e, t, n) {
            let r = this.halfExtents,
                i = [
                    [r.x, r.y, r.z],
                    [-r.x, r.y, r.z],
                    [-r.x, -r.y, r.z],
                    [-r.x, -r.y, -r.z],
                    [r.x, -r.y, -r.z],
                    [r.x, r.y, -r.z],
                    [-r.x, r.y, -r.z],
                    [r.x, -r.y, r.z]
                ];
            for (let r = 0; r < i.length; r++) af.set(i[r][0], i[r][1], i[r][2]), t.vmult(af, af), e.vadd(af, af), n(af.x, af.y, af.z)
        }
        calculateWorldAABB(e, t, n, r) {
            let i = this.halfExtents;
            of [0].set(i.x, i.y, i.z), of [1].set(-i.x, i.y, i.z), of [2].set(-i.x, -i.y, i.z), of [3].set(-i.x, -i.y, -i.z), of [4].set(i.x, -i.y, -i.z), of [5].set(i.x, i.y, -i.z), of [6].set(-i.x, i.y, -i.z), of [7].set(i.x, -i.y, i.z);
            let a = of [0];
            t.vmult(a, a), e.vadd(a, a), r.copy(a), n.copy(a);
            for (let i = 1; i < 8; i++) {
                let a = of [i];
                t.vmult(a, a), e.vadd(a, a);
                let o = a.x,
                    s = a.y,
                    c = a.z;
                o > r.x && (r.x = o), s > r.y && (r.y = s), c > r.z && (r.z = c), o < n.x && (n.x = o), s < n.y && (n.y = s), c < n.z && (n.z = c)
            }
        }
    },
    af = new X,
    of = [new X, new X, new X, new X, new X, new X, new X, new X],
    sf = {
        DYNAMIC: 1,
        STATIC: 2,
        KINEMATIC: 4
    },
    cf = {
        AWAKE: 0,
        SLEEPY: 1,
        SLEEPING: 2
    },
    Q = class e extends Gd {
        constructor(t) {
            t === void 0 && (t = {}), super(), this.id = e.idCounter++, this.index = -1, this.world = null, this.vlambda = new X, this.collisionFilterGroup = typeof t.collisionFilterGroup == `number` ? t.collisionFilterGroup : 1, this.collisionFilterMask = typeof t.collisionFilterMask == `number` ? t.collisionFilterMask : -1, this.collisionResponse = typeof t.collisionResponse != `boolean` || t.collisionResponse, this.position = new X, this.previousPosition = new X, this.interpolatedPosition = new X, this.initPosition = new X, t.position && (this.position.copy(t.position), this.previousPosition.copy(t.position), this.interpolatedPosition.copy(t.position), this.initPosition.copy(t.position)), this.velocity = new X, t.velocity && this.velocity.copy(t.velocity), this.initVelocity = new X, this.force = new X;
            let n = typeof t.mass == `number` ? t.mass : 0;
            this.mass = n, this.invMass = n > 0 ? 1 / n : 0, this.material = t.material || null, this.linearDamping = typeof t.linearDamping == `number` ? t.linearDamping : .01, this.type = n <= 0 ? e.STATIC : e.DYNAMIC, typeof t.type == typeof e.STATIC && (this.type = t.type), this.allowSleep = t.allowSleep === void 0 || t.allowSleep, this.sleepState = e.AWAKE, this.sleepSpeedLimit = t.sleepSpeedLimit === void 0 ? .1 : t.sleepSpeedLimit, this.sleepTimeLimit = t.sleepTimeLimit === void 0 ? 1 : t.sleepTimeLimit, this.timeLastSleepy = 0, this.wakeUpAfterNarrowphase = !1, this.torque = new X, this.quaternion = new Kd, this.initQuaternion = new Kd, this.previousQuaternion = new Kd, this.interpolatedQuaternion = new Kd, t.quaternion && (this.quaternion.copy(t.quaternion), this.initQuaternion.copy(t.quaternion), this.previousQuaternion.copy(t.quaternion), this.interpolatedQuaternion.copy(t.quaternion)), this.angularVelocity = new X, t.angularVelocity && this.angularVelocity.copy(t.angularVelocity), this.initAngularVelocity = new X, this.shapes = [], this.shapeOffsets = [], this.shapeOrientations = [], this.inertia = new X, this.invInertia = new X, this.invInertiaWorld = new Id, this.invMassSolve = 0, this.invInertiaSolve = new X, this.invInertiaWorldSolve = new Id, this.fixedRotation = t.fixedRotation !== void 0 && t.fixedRotation, this.angularDamping = t.angularDamping === void 0 ? .01 : t.angularDamping, this.linearFactor = new X(1, 1, 1), t.linearFactor && this.linearFactor.copy(t.linearFactor), this.angularFactor = new X(1, 1, 1), t.angularFactor && this.angularFactor.copy(t.angularFactor), this.aabb = new Vd, this.aabbNeedsUpdate = !0, this.boundingRadius = 0, this.wlambda = new X, this.isTrigger = !!t.isTrigger, t.shape && this.addShape(t.shape), this.updateMassProperties()
        }
        wakeUp() {
            let t = this.sleepState;
            this.sleepState = e.AWAKE, this.wakeUpAfterNarrowphase = !1, t === e.SLEEPING && this.dispatchEvent(e.wakeupEvent)
        }
        sleep() {
            this.sleepState = e.SLEEPING, this.velocity.set(0, 0, 0), this.angularVelocity.set(0, 0, 0), this.wakeUpAfterNarrowphase = !1
        }
        sleepTick(t) {
            if (this.allowSleep) {
                let n = this.sleepState,
                    r = this.velocity.lengthSquared() + this.angularVelocity.lengthSquared(),
                    i = this.sleepSpeedLimit ** 2;
                n === e.AWAKE && r < i ? (this.sleepState = e.SLEEPY, this.timeLastSleepy = t, this.dispatchEvent(e.sleepyEvent)) : n === e.SLEEPY && r > i ? this.wakeUp() : n === e.SLEEPY && t - this.timeLastSleepy > this.sleepTimeLimit && (this.sleep(), this.dispatchEvent(e.sleepEvent))
            }
        }
        updateSolveMassProperties() {
            this.sleepState === e.SLEEPING || this.type === e.KINEMATIC ? (this.invMassSolve = 0, this.invInertiaSolve.setZero(), this.invInertiaWorldSolve.setZero()) : (this.invMassSolve = this.invMass, this.invInertiaSolve.copy(this.invInertia), this.invInertiaWorldSolve.copy(this.invInertiaWorld))
        }
        pointToLocalFrame(e, t) {
            return t === void 0 && (t = new X), e.vsub(this.position, t), this.quaternion.conjugate().vmult(t, t), t
        }
        vectorToLocalFrame(e, t) {
            return t === void 0 && (t = new X), this.quaternion.conjugate().vmult(e, t), t
        }
        pointToWorldFrame(e, t) {
            return t === void 0 && (t = new X), this.quaternion.vmult(e, t), t.vadd(this.position, t), t
        }
        vectorToWorldFrame(e, t) {
            return t === void 0 && (t = new X), this.quaternion.vmult(e, t), t
        }
        addShape(e, t, n) {
            let r = new X,
                i = new Kd;
            return t && r.copy(t), n && i.copy(n), this.shapes.push(e), this.shapeOffsets.push(r), this.shapeOrientations.push(i), this.updateMassProperties(), this.updateBoundingRadius(), this.aabbNeedsUpdate = !0, e.body = this, this
        }
        removeShape(e) {
            let t = this.shapes.indexOf(e);
            return t === -1 ? (console.warn(`Shape does not belong to the body`), this) : (this.shapes.splice(t, 1), this.shapeOffsets.splice(t, 1), this.shapeOrientations.splice(t, 1), this.updateMassProperties(), this.updateBoundingRadius(), this.aabbNeedsUpdate = !0, e.body = null, this)
        }
        updateBoundingRadius() {
            let e = this.shapes,
                t = this.shapeOffsets,
                n = e.length,
                r = 0;
            for (let i = 0; i !== n; i++) {
                let n = e[i];
                n.updateBoundingSphereRadius();
                let a = t[i].length(),
                    o = n.boundingSphereRadius;
                a + o > r && (r = a + o)
            }
            this.boundingRadius = r
        }
        updateAABB() {
            let e = this.shapes,
                t = this.shapeOffsets,
                n = this.shapeOrientations,
                r = e.length,
                i = lf,
                a = uf,
                o = this.quaternion,
                s = this.aabb,
                c = df;
            for (let l = 0; l !== r; l++) {
                let r = e[l];
                o.vmult(t[l], i), i.vadd(this.position, i), o.mult(n[l], a), r.calculateWorldAABB(i, a, c.lowerBound, c.upperBound), l === 0 ? s.copy(c) : s.extend(c)
            }
            this.aabbNeedsUpdate = !1
        }
        updateInertiaWorld(e) {
            let t = this.invInertia;
            if (t.x !== t.y || t.y !== t.z || e) {
                let e = ff,
                    n = pf;
                e.setRotationFromQuaternion(this.quaternion), e.transpose(n), e.scale(t, e), e.mmult(n, this.invInertiaWorld)
            }
        }
        applyForce(t, n) {
            if (n === void 0 && (n = new X), this.type !== e.DYNAMIC) return;
            this.sleepState === e.SLEEPING && this.wakeUp();
            let r = mf;
            n.cross(t, r), this.force.vadd(t, this.force), this.torque.vadd(r, this.torque)
        }
        applyLocalForce(t, n) {
            if (n === void 0 && (n = new X), this.type !== e.DYNAMIC) return;
            let r = hf,
                i = gf;
            this.vectorToWorldFrame(t, r), this.vectorToWorldFrame(n, i), this.applyForce(r, i)
        }
        applyTorque(t) {
            this.type === e.DYNAMIC && (this.sleepState === e.SLEEPING && this.wakeUp(), this.torque.vadd(t, this.torque))
        }
        applyImpulse(t, n) {
            if (n === void 0 && (n = new X), this.type !== e.DYNAMIC) return;
            this.sleepState === e.SLEEPING && this.wakeUp();
            let r = n,
                i = _f;
            i.copy(t), i.scale(this.invMass, i), this.velocity.vadd(i, this.velocity);
            let a = vf;
            r.cross(t, a), this.invInertiaWorld.vmult(a, a), this.angularVelocity.vadd(a, this.angularVelocity)
        }
        applyLocalImpulse(t, n) {
            if (n === void 0 && (n = new X), this.type !== e.DYNAMIC) return;
            let r = yf,
                i = bf;
            this.vectorToWorldFrame(t, r), this.vectorToWorldFrame(n, i), this.applyImpulse(r, i)
        }
        updateMassProperties() {
            let e = xf;
            this.invMass = this.mass > 0 ? 1 / this.mass : 0;
            let t = this.inertia,
                n = this.fixedRotation;
            this.updateAABB(), e.set((this.aabb.upperBound.x - this.aabb.lowerBound.x) / 2, (this.aabb.upperBound.y - this.aabb.lowerBound.y) / 2, (this.aabb.upperBound.z - this.aabb.lowerBound.z) / 2), rf.calculateInertia(e, this.mass, t), this.invInertia.set(t.x > 0 && !n ? 1 / t.x : 0, t.y > 0 && !n ? 1 / t.y : 0, t.z > 0 && !n ? 1 / t.z : 0), this.updateInertiaWorld(!0)
        }
        getVelocityAtWorldPoint(e, t) {
            let n = new X;
            return e.vsub(this.position, n), this.angularVelocity.cross(n, t), this.velocity.vadd(t, t), t
        }
        integrate(t, n, r) {
            if (this.previousPosition.copy(this.position), this.previousQuaternion.copy(this.quaternion), this.type !== e.DYNAMIC && this.type !== e.KINEMATIC || this.sleepState === e.SLEEPING) return;
            let i = this.velocity,
                a = this.angularVelocity,
                o = this.position,
                s = this.force,
                c = this.torque,
                l = this.quaternion,
                u = this.invMass,
                d = this.invInertiaWorld,
                f = this.linearFactor,
                p = u * t;
            i.x += s.x * p * f.x, i.y += s.y * p * f.y, i.z += s.z * p * f.z;
            let m = d.elements,
                h = this.angularFactor,
                g = c.x * h.x,
                _ = c.y * h.y,
                v = c.z * h.z;
            a.x += t * (m[0] * g + m[1] * _ + m[2] * v), a.y += t * (m[3] * g + m[4] * _ + m[5] * v), a.z += t * (m[6] * g + m[7] * _ + m[8] * v), o.x += i.x * t, o.y += i.y * t, o.z += i.z * t, l.integrate(this.angularVelocity, t, this.angularFactor, l), n && (r ? l.normalizeFast() : l.normalize()), this.aabbNeedsUpdate = !0, this.updateInertiaWorld()
        }
    };
Q.idCounter = 0, Q.COLLIDE_EVENT_NAME = `collide`, Q.DYNAMIC = sf.DYNAMIC, Q.STATIC = sf.STATIC, Q.KINEMATIC = sf.KINEMATIC, Q.AWAKE = cf.AWAKE, Q.SLEEPY = cf.SLEEPY, Q.SLEEPING = cf.SLEEPING, Q.wakeupEvent = {
    type: `wakeup`
}, Q.sleepyEvent = {
    type: `sleepy`
}, Q.sleepEvent = {
    type: `sleep`
};
var lf = new X,
    uf = new Kd,
    df = new Vd,
    ff = new Id,
    pf = new Id;
new Id;
var mf = new X,
    hf = new X,
    gf = new X,
    _f = new X,
    vf = new X,
    yf = new X,
    bf = new X,
    xf = new X,
    Sf = class {
        constructor() {
            this.world = null, this.useBoundingBoxes = !1, this.dirty = !0
        }
        collisionPairs(e, t, n) {
            throw Error(`collisionPairs not implemented for this BroadPhase class!`)
        }
        needBroadphaseCollision(e, t) {
            return (e.collisionFilterGroup & t.collisionFilterMask) !== 0 && (t.collisionFilterGroup & e.collisionFilterMask) !== 0 && ((e.type & Q.STATIC) === 0 && e.sleepState !== Q.SLEEPING || (t.type & Q.STATIC) === 0 && t.sleepState !== Q.SLEEPING)
        }
        intersectionTest(e, t, n, r) {
            this.useBoundingBoxes ? this.doBoundingBoxBroadphase(e, t, n, r) : this.doBoundingSphereBroadphase(e, t, n, r)
        }
        doBoundingSphereBroadphase(e, t, n, r) {
            let i = Cf;
            t.position.vsub(e.position, i);
            let a = (e.boundingRadius + t.boundingRadius) ** 2;
            i.lengthSquared() < a && (n.push(e), r.push(t))
        }
        doBoundingBoxBroadphase(e, t, n, r) {
            e.aabbNeedsUpdate && e.updateAABB(), t.aabbNeedsUpdate && t.updateAABB(), e.aabb.overlaps(t.aabb) && (n.push(e), r.push(t))
        }
        makePairsUnique(e, t) {
            let n = wf,
                r = Tf,
                i = Ef,
                a = e.length;
            for (let n = 0; n !== a; n++) r[n] = e[n], i[n] = t[n];
            e.length = 0, t.length = 0;
            for (let e = 0; e !== a; e++) {
                let t = r[e].id,
                    a = i[e].id,
                    o = t < a ? `${t},${a}` : `${a},${t}`;
                n[o] = e, n.keys.push(o)
            }
            for (let a = 0; a !== n.keys.length; a++) {
                let a = n.keys.pop(),
                    o = n[a];
                e.push(r[o]), t.push(i[o]), delete n[a]
            }
        }
        setWorld(e) {}
        static boundingSphereCheck(e, t) {
            let n = new X;
            e.position.vsub(t.position, n);
            let r = e.shapes[0],
                i = t.shapes[0];
            return (r.boundingSphereRadius + i.boundingSphereRadius) ** 2 > n.lengthSquared()
        }
        aabbQuery(e, t, n) {
            return console.warn(`.aabbQuery is not implemented in this Broadphase subclass.`), []
        }
    },
    Cf = new X;
new X, new Kd, new X;
var wf = {
        keys: []
    },
    Tf = [],
    Ef = [];
new X, new X, new X;
var Df = class extends Sf {
        constructor() {
            super()
        }
        collisionPairs(e, t, n) {
            let r = e.bodies,
                i = r.length,
                a, o;
            for (let e = 0; e !== i; e++)
                for (let i = 0; i !== e; i++) a = r[e], o = r[i], this.needBroadphaseCollision(a, o) && this.intersectionTest(a, o, t, n)
        }
        aabbQuery(e, t, n) {
            n === void 0 && (n = []);
            for (let r = 0; r < e.bodies.length; r++) {
                let i = e.bodies[r];
                i.aabbNeedsUpdate && i.updateAABB(), i.aabb.overlaps(t) && n.push(i)
            }
            return n
        }
    },
    Of = class {
        constructor() {
            this.rayFromWorld = new X, this.rayToWorld = new X, this.hitNormalWorld = new X, this.hitPointWorld = new X, this.hasHit = !1, this.shape = null, this.body = null, this.hitFaceIndex = -1, this.distance = -1, this.shouldStop = !1
        }
        reset() {
            this.rayFromWorld.setZero(), this.rayToWorld.setZero(), this.hitNormalWorld.setZero(), this.hitPointWorld.setZero(), this.hasHit = !1, this.shape = null, this.body = null, this.hitFaceIndex = -1, this.distance = -1, this.shouldStop = !1
        }
        abort() {
            this.shouldStop = !0
        }
        set(e, t, n, r, i, a, o) {
            this.rayFromWorld.copy(e), this.rayToWorld.copy(t), this.hitNormalWorld.copy(n), this.hitPointWorld.copy(r), this.shape = i, this.body = a, this.distance = o
        }
    },
    kf, Af, jf, Mf, Nf, Pf, Ff, If = {
        CLOSEST: 1,
        ANY: 2,
        ALL: 4
    };
kf = Z.types.SPHERE, Af = Z.types.PLANE, jf = Z.types.BOX, Mf = Z.types.CYLINDER, Nf = Z.types.CONVEXPOLYHEDRON, Pf = Z.types.HEIGHTFIELD, Ff = Z.types.TRIMESH;
var Lf = class e {
    get[kf]() {
        return this._intersectSphere
    }
    get[Af]() {
        return this._intersectPlane
    }
    get[jf]() {
        return this._intersectBox
    }
    get[Mf]() {
        return this._intersectConvex
    }
    get[Nf]() {
        return this._intersectConvex
    }
    get[Pf]() {
        return this._intersectHeightfield
    }
    get[Ff]() {
        return this._intersectTrimesh
    }
    constructor(t, n) {
        t === void 0 && (t = new X), n === void 0 && (n = new X), this.from = t.clone(), this.to = n.clone(), this.direction = new X, this.precision = 1e-4, this.checkCollisionResponse = !0, this.skipBackfaces = !1, this.collisionFilterMask = -1, this.collisionFilterGroup = -1, this.mode = e.ANY, this.result = new Of, this.hasHit = !1, this.callback = e => {}
    }
    intersectWorld(t, n) {
        return this.mode = n.mode || e.ANY, this.result = n.result || new Of, this.skipBackfaces = !!n.skipBackfaces, this.collisionFilterMask = n.collisionFilterMask === void 0 ? -1 : n.collisionFilterMask, this.collisionFilterGroup = n.collisionFilterGroup === void 0 ? -1 : n.collisionFilterGroup, this.checkCollisionResponse = n.checkCollisionResponse === void 0 || n.checkCollisionResponse, n.from && this.from.copy(n.from), n.to && this.to.copy(n.to), this.callback = n.callback || (() => {}), this.hasHit = !1, this.result.reset(), this.updateDirection(), this.getAABB(Rf), zf.length = 0, t.broadphase.aabbQuery(t, Rf, zf), this.intersectBodies(zf), this.hasHit
    }
    intersectBody(e, t) {
        t && (this.result = t, this.updateDirection());
        let n = this.checkCollisionResponse;
        if (n && !e.collisionResponse || (this.collisionFilterGroup & e.collisionFilterMask) === 0 || (e.collisionFilterGroup & this.collisionFilterMask) === 0) return;
        let r = Hf,
            i = Uf;
        for (let t = 0, a = e.shapes.length; t < a; t++) {
            let a = e.shapes[t];
            if ((!n || a.collisionResponse) && (e.quaternion.mult(e.shapeOrientations[t], i), e.quaternion.vmult(e.shapeOffsets[t], r), r.vadd(e.position, r), this.intersectShape(a, i, r, e), this.result.shouldStop)) break
        }
    }
    intersectBodies(e, t) {
        t && (this.result = t, this.updateDirection());
        for (let t = 0, n = e.length; !this.result.shouldStop && t < n; t++) this.intersectBody(e[t])
    }
    updateDirection() {
        this.to.vsub(this.from, this.direction), this.direction.normalize()
    }
    intersectShape(e, t, n, r) {
        let i = this.from;
        if (fp(i, this.direction, n) > e.boundingSphereRadius) return;
        let a = this[e.type];
        a && a.call(this, e, t, n, r, e)
    }
    _intersectBox(e, t, n, r, i) {
        return this._intersectConvex(e.convexPolyhedronRepresentation, t, n, r, i)
    }
    _intersectPlane(e, t, n, r, i) {
        let a = this.from,
            o = this.to,
            s = this.direction,
            c = new X(0, 0, 1);
        t.vmult(c, c);
        let l = new X;
        a.vsub(n, l);
        let u = l.dot(c);
        if (o.vsub(n, l), u * l.dot(c) > 0 || a.distanceTo(o) < u) return;
        let d = c.dot(s);
        if (Math.abs(d) < this.precision) return;
        let f = new X,
            p = new X,
            m = new X;
        a.vsub(n, f);
        let h = -c.dot(f) / d;
        s.scale(h, p), a.vadd(p, m), this.reportIntersection(c, m, i, r, -1)
    }
    getAABB(e) {
        let {
            lowerBound: t,
            upperBound: n
        } = e, r = this.to, i = this.from;
        t.x = Math.min(r.x, i.x), t.y = Math.min(r.y, i.y), t.z = Math.min(r.z, i.z), n.x = Math.max(r.x, i.x), n.y = Math.max(r.y, i.y), n.z = Math.max(r.z, i.z)
    }
    _intersectHeightfield(e, t, n, r, i) {
        e.data, e.elementSize;
        let a = Xf;
        a.from.copy(this.from), a.to.copy(this.to), Xd.pointToLocalFrame(n, t, a.from, a.from), Xd.pointToLocalFrame(n, t, a.to, a.to), a.updateDirection();
        let o = Zf,
            s, c, l, u;
        s = c = 0, l = u = e.data.length - 1;
        let d = new Vd;
        a.getAABB(d), e.getIndexOfPosition(d.lowerBound.x, d.lowerBound.y, o, !0), s = Math.max(s, o[0]), c = Math.max(c, o[1]), e.getIndexOfPosition(d.upperBound.x, d.upperBound.y, o, !0), l = Math.min(l, o[0] + 1), u = Math.min(u, o[1] + 1);
        for (let o = s; o < l; o++)
            for (let s = c; s < u; s++) {
                if (this.result.shouldStop) return;
                if (e.getAabbAtIndex(o, s, d), d.overlapsRay(a)) {
                    if (e.getConvexTrianglePillar(o, s, !1), Xd.pointToWorldFrame(n, t, e.pillarOffset, Yf), this._intersectConvex(e.pillarConvex, t, Yf, r, i, Jf), this.result.shouldStop) return;
                    e.getConvexTrianglePillar(o, s, !0), Xd.pointToWorldFrame(n, t, e.pillarOffset, Yf), this._intersectConvex(e.pillarConvex, t, Yf, r, i, Jf)
                }
            }
    }
    _intersectSphere(e, t, n, r, i) {
        let a = this.from,
            o = this.to,
            s = e.radius,
            c = (o.x - a.x) ** 2 + (o.y - a.y) ** 2 + (o.z - a.z) ** 2,
            l = 2 * ((o.x - a.x) * (a.x - n.x) + (o.y - a.y) * (a.y - n.y) + (o.z - a.z) * (a.z - n.z)),
            u = (a.x - n.x) ** 2 + (a.y - n.y) ** 2 + (a.z - n.z) ** 2 - s ** 2,
            d = l ** 2 - 4 * c * u,
            f = Qf,
            p = $f;
        if (!(d < 0)) {
            if (d === 0) a.lerp(o, d, f), f.vsub(n, p), p.normalize(), this.reportIntersection(p, f, i, r, -1);
            else {
                let e = (-l - Math.sqrt(d)) / (2 * c),
                    t = (-l + Math.sqrt(d)) / (2 * c);
                if (e >= 0 && e <= 1 && (a.lerp(o, e, f), f.vsub(n, p), p.normalize(), this.reportIntersection(p, f, i, r, -1)), this.result.shouldStop) return;
                t >= 0 && t <= 1 && (a.lerp(o, t, f), f.vsub(n, p), p.normalize(), this.reportIntersection(p, f, i, r, -1))
            }
        }
    }
    _intersectConvex(t, n, r, i, a, o) {
        let s = ep,
            c = tp,
            l = o && o.faceList || null,
            u = t.faces,
            d = t.vertices,
            f = t.faceNormals,
            p = this.direction,
            m = this.from,
            h = this.to,
            g = m.distanceTo(h),
            _ = l ? l.length : u.length,
            v = this.result;
        for (let t = 0; !v.shouldStop && t < _; t++) {
            let o = l ? l[t] : t,
                h = u[o],
                _ = f[o],
                y = n,
                b = r;
            c.copy(d[h[0]]), y.vmult(c, c), c.vadd(b, c), c.vsub(m, c), y.vmult(_, s);
            let x = p.dot(s);
            if (Math.abs(x) < this.precision) continue;
            let S = s.dot(c) / x;
            if (!(S < 0)) {
                p.scale(S, Wf), Wf.vadd(m, Wf), Gf.copy(d[h[0]]), y.vmult(Gf, Gf), b.vadd(Gf, Gf);
                for (let t = 1; !v.shouldStop && t < h.length - 1; t++) {
                    Kf.copy(d[h[t]]), qf.copy(d[h[t + 1]]), y.vmult(Kf, Kf), y.vmult(qf, qf), b.vadd(Kf, Kf), b.vadd(qf, qf);
                    let n = Wf.distanceTo(m);
                    !(e.pointInTriangle(Wf, Gf, Kf, qf) || e.pointInTriangle(Wf, Kf, Gf, qf)) || n > g || this.reportIntersection(s, Wf, a, i, o)
                }
            }
        }
    }
    _intersectTrimesh(t, n, r, i, a, o) {
        let s = np,
            c = cp,
            l = lp,
            u = tp,
            d = rp,
            f = ip,
            p = ap,
            m = sp,
            h = op,
            g = t.indices;
        t.vertices;
        let _ = this.from,
            v = this.to,
            y = this.direction;
        l.position.copy(r), l.quaternion.copy(n), Xd.vectorToLocalFrame(r, n, y, d), Xd.pointToLocalFrame(r, n, _, f), Xd.pointToLocalFrame(r, n, v, p), p.x *= t.scale.x, p.y *= t.scale.y, p.z *= t.scale.z, f.x *= t.scale.x, f.y *= t.scale.y, f.z *= t.scale.z, p.vsub(f, d), d.normalize();
        let b = f.distanceSquared(p);
        t.tree.rayQuery(this, l, c);
        for (let o = 0, l = c.length; !this.result.shouldStop && o !== l; o++) {
            let l = c[o];
            t.getNormal(l, s), t.getVertex(g[l * 3], Gf), Gf.vsub(f, u);
            let p = d.dot(s),
                _ = s.dot(u) / p;
            if (_ < 0) continue;
            d.scale(_, Wf), Wf.vadd(f, Wf), t.getVertex(g[l * 3 + 1], Kf), t.getVertex(g[l * 3 + 2], qf);
            let v = Wf.distanceSquared(f);
            !(e.pointInTriangle(Wf, Kf, Gf, qf) || e.pointInTriangle(Wf, Gf, Kf, qf)) || v > b || (Xd.vectorToWorldFrame(n, s, h), Xd.pointToWorldFrame(r, n, Wf, m), this.reportIntersection(h, m, a, i, l))
        }
        c.length = 0
    }
    reportIntersection(t, n, r, i, a) {
        let o = this.from,
            s = this.to,
            c = o.distanceTo(n),
            l = this.result;
        if (!(this.skipBackfaces && t.dot(this.direction) > 0)) switch (l.hitFaceIndex = a === void 0 ? -1 : a, this.mode) {
            case e.ALL:
                this.hasHit = !0, l.set(o, s, t, n, r, i, c), l.hasHit = !0, this.callback(l);
                break;
            case e.CLOSEST:
                (c < l.distance || !l.hasHit) && (this.hasHit = !0, l.hasHit = !0, l.set(o, s, t, n, r, i, c));
                break;
            case e.ANY:
                this.hasHit = !0, l.hasHit = !0, l.set(o, s, t, n, r, i, c), l.shouldStop = !0
        }
    }
    static pointInTriangle(e, t, n, r) {
        r.vsub(t, up), n.vsub(t, Bf), e.vsub(t, Vf);
        let i = up.dot(up),
            a = up.dot(Bf),
            o = up.dot(Vf),
            s = Bf.dot(Bf),
            c = Bf.dot(Vf),
            l, u;
        return (l = s * o - a * c) >= 0 && (u = i * c - a * o) >= 0 && l + u < i * s - a * a
    }
};
Lf.CLOSEST = If.CLOSEST, Lf.ANY = If.ANY, Lf.ALL = If.ALL;
var Rf = new Vd,
    zf = [],
    Bf = new X,
    Vf = new X,
    Hf = new X,
    Uf = new Kd,
    Wf = new X,
    Gf = new X,
    Kf = new X,
    qf = new X;
new X, new Of;
var Jf = {
        faceList: [0]
    },
    Yf = new X,
    Xf = new Lf,
    Zf = [],
    Qf = new X,
    $f = new X,
    ep = new X;
new X, new X;
var tp = new X,
    np = new X,
    rp = new X,
    ip = new X,
    ap = new X,
    op = new X,
    sp = new X;
new Vd;
var cp = [],
    lp = new Xd,
    up = new X,
    dp = new X;

function fp(e, t, n) {
    n.vsub(e, up);
    let r = up.dot(t);
    return t.scale(r, dp), dp.vadd(e, dp), n.distanceTo(dp)
}
var pp = class e extends Sf {
        static checkBounds(e, t, n) {
            let r, i;
            n === 0 ? (r = e.position.x, i = t.position.x) : n === 1 ? (r = e.position.y, i = t.position.y) : n === 2 && (r = e.position.z, i = t.position.z);
            let a = e.boundingRadius,
                o = t.boundingRadius,
                s = r + a;
            return i - o < s
        }
        static insertionSortX(e) {
            for (let t = 1, n = e.length; t < n; t++) {
                let n = e[t],
                    r;
                for (r = t - 1; r >= 0 && !(e[r].aabb.lowerBound.x <= n.aabb.lowerBound.x); r--) e[r + 1] = e[r];
                e[r + 1] = n
            }
            return e
        }
        static insertionSortY(e) {
            for (let t = 1, n = e.length; t < n; t++) {
                let n = e[t],
                    r;
                for (r = t - 1; r >= 0 && !(e[r].aabb.lowerBound.y <= n.aabb.lowerBound.y); r--) e[r + 1] = e[r];
                e[r + 1] = n
            }
            return e
        }
        static insertionSortZ(e) {
            for (let t = 1, n = e.length; t < n; t++) {
                let n = e[t],
                    r;
                for (r = t - 1; r >= 0 && !(e[r].aabb.lowerBound.z <= n.aabb.lowerBound.z); r--) e[r + 1] = e[r];
                e[r + 1] = n
            }
            return e
        }
        constructor(e) {
            super(), this.axisList = [], this.world = null, this.axisIndex = 0;
            let t = this.axisList;
            this._addBodyHandler = e => {
                t.push(e.body)
            }, this._removeBodyHandler = e => {
                let n = t.indexOf(e.body);
                n !== -1 && t.splice(n, 1)
            }, e && this.setWorld(e)
        }
        setWorld(e) {
            this.axisList.length = 0;
            for (let t = 0; t < e.bodies.length; t++) this.axisList.push(e.bodies[t]);
            e.removeEventListener(`addBody`, this._addBodyHandler), e.removeEventListener(`removeBody`, this._removeBodyHandler), e.addEventListener(`addBody`, this._addBodyHandler), e.addEventListener(`removeBody`, this._removeBodyHandler), this.world = e, this.dirty = !0
        }
        collisionPairs(t, n, r) {
            let i = this.axisList,
                a = i.length,
                o = this.axisIndex,
                s, c;
            for (this.dirty &&= (this.sortList(), !1), s = 0; s !== a; s++) {
                let t = i[s];
                for (c = s + 1; c < a; c++) {
                    let a = i[c];
                    if (this.needBroadphaseCollision(t, a)) {
                        if (!e.checkBounds(t, a, o)) break;
                        this.intersectionTest(t, a, n, r)
                    }
                }
            }
        }
        sortList() {
            let t = this.axisList,
                n = this.axisIndex,
                r = t.length;
            for (let e = 0; e !== r; e++) {
                let n = t[e];
                n.aabbNeedsUpdate && n.updateAABB()
            }
            n === 0 ? e.insertionSortX(t) : n === 1 ? e.insertionSortY(t) : n === 2 && e.insertionSortZ(t)
        }
        autoDetectAxis() {
            let e = 0,
                t = 0,
                n = 0,
                r = 0,
                i = 0,
                a = 0,
                o = this.axisList,
                s = o.length,
                c = 1 / s;
            for (let c = 0; c !== s; c++) {
                let s = o[c],
                    l = s.position.x;
                e += l, t += l * l;
                let u = s.position.y;
                n += u, r += u * u;
                let d = s.position.z;
                i += d, a += d * d
            }
            let l = t - e * e * c,
                u = r - n * n * c,
                d = a - i * i * c;
            this.axisIndex = l > u ? l > d ? 0 : 2 : u > d ? 1 : 2
        }
        aabbQuery(e, t, n) {
            n === void 0 && (n = []), this.dirty &&= (this.sortList(), !1);
            let r = this.axisIndex,
                i = `x`;
            r === 1 && (i = `y`), r === 2 && (i = `z`);
            let a = this.axisList;
            t.lowerBound[i], t.upperBound[i];
            for (let e = 0; e < a.length; e++) {
                let r = a[e];
                r.aabbNeedsUpdate && r.updateAABB(), r.aabb.overlaps(t) && n.push(r)
            }
            return n
        }
    },
    mp = class {
        static defaults(e, t) {
            e === void 0 && (e = {});
            for (let n in t) n in e || (e[n] = t[n]);
            return e
        }
    },
    hp = class {
        constructor() {
            this.spatial = new X, this.rotational = new X
        }
        multiplyElement(e) {
            return e.spatial.dot(this.spatial) + e.rotational.dot(this.rotational)
        }
        multiplyVectors(e, t) {
            return e.dot(this.spatial) + t.dot(this.rotational)
        }
    },
    gp = class e {
        constructor(t, n, r, i) {
            r === void 0 && (r = -1e6), i === void 0 && (i = 1e6), this.id = e.idCounter++, this.minForce = r, this.maxForce = i, this.bi = t, this.bj = n, this.a = 0, this.b = 0, this.eps = 0, this.jacobianElementA = new hp, this.jacobianElementB = new hp, this.enabled = !0, this.multiplier = 0, this.setSpookParams(1e7, 4, 1 / 60)
        }
        setSpookParams(e, t, n) {
            let r = t,
                i = e,
                a = n;
            this.a = 4 / (a * (1 + 4 * r)), this.b = 4 * r / (1 + 4 * r), this.eps = 4 / (a * a * i * (1 + 4 * r))
        }
        computeB(e, t, n) {
            let r = this.computeGW(),
                i = this.computeGq(),
                a = this.computeGiMf();
            return -i * e - r * t - a * n
        }
        computeGq() {
            let e = this.jacobianElementA,
                t = this.jacobianElementB,
                n = this.bi,
                r = this.bj,
                i = n.position,
                a = r.position;
            return e.spatial.dot(i) + t.spatial.dot(a)
        }
        computeGW() {
            let e = this.jacobianElementA,
                t = this.jacobianElementB,
                n = this.bi,
                r = this.bj,
                i = n.velocity,
                a = r.velocity,
                o = n.angularVelocity,
                s = r.angularVelocity;
            return e.multiplyVectors(i, o) + t.multiplyVectors(a, s)
        }
        computeGWlambda() {
            let e = this.jacobianElementA,
                t = this.jacobianElementB,
                n = this.bi,
                r = this.bj,
                i = n.vlambda,
                a = r.vlambda,
                o = n.wlambda,
                s = r.wlambda;
            return e.multiplyVectors(i, o) + t.multiplyVectors(a, s)
        }
        computeGiMf() {
            let e = this.jacobianElementA,
                t = this.jacobianElementB,
                n = this.bi,
                r = this.bj,
                i = n.force,
                a = n.torque,
                o = r.force,
                s = r.torque,
                c = n.invMassSolve,
                l = r.invMassSolve;
            return i.scale(c, _p), o.scale(l, vp), n.invInertiaWorldSolve.vmult(a, yp), r.invInertiaWorldSolve.vmult(s, bp), e.multiplyVectors(_p, yp) + t.multiplyVectors(vp, bp)
        }
        computeGiMGt() {
            let e = this.jacobianElementA,
                t = this.jacobianElementB,
                n = this.bi,
                r = this.bj,
                i = n.invMassSolve,
                a = r.invMassSolve,
                o = n.invInertiaWorldSolve,
                s = r.invInertiaWorldSolve,
                c = i + a;
            return o.vmult(e.rotational, xp), c += xp.dot(e.rotational), s.vmult(t.rotational, xp), c += xp.dot(t.rotational), c
        }
        addToWlambda(e) {
            let t = this.jacobianElementA,
                n = this.jacobianElementB,
                r = this.bi,
                i = this.bj,
                a = Sp;
            r.vlambda.addScaledVector(r.invMassSolve * e, t.spatial, r.vlambda), i.vlambda.addScaledVector(i.invMassSolve * e, n.spatial, i.vlambda), r.invInertiaWorldSolve.vmult(t.rotational, a), r.wlambda.addScaledVector(e, a, r.wlambda), i.invInertiaWorldSolve.vmult(n.rotational, a), i.wlambda.addScaledVector(e, a, i.wlambda)
        }
        computeC() {
            return this.computeGiMGt() + this.eps
        }
    };
gp.idCounter = 0;
var _p = new X,
    vp = new X,
    yp = new X,
    bp = new X,
    xp = new X,
    Sp = new X,
    Cp = class extends gp {
        constructor(e, t, n) {
            n === void 0 && (n = 1e6), super(e, t, 0, n), this.restitution = 0, this.ri = new X, this.rj = new X, this.ni = new X
        }
        computeB(e) {
            let t = this.a,
                n = this.b,
                r = this.bi,
                i = this.bj,
                a = this.ri,
                o = this.rj,
                s = wp,
                c = Tp,
                l = r.velocity,
                u = r.angularVelocity;
            r.force, r.torque;
            let d = i.velocity,
                f = i.angularVelocity;
            i.force, i.torque;
            let p = Ep,
                m = this.jacobianElementA,
                h = this.jacobianElementB,
                g = this.ni;
            a.cross(g, s), o.cross(g, c), g.negate(m.spatial), s.negate(m.rotational), h.spatial.copy(g), h.rotational.copy(c), p.copy(i.position), p.vadd(o, p), p.vsub(r.position, p), p.vsub(a, p);
            let _ = g.dot(p),
                v = this.restitution + 1,
                y = v * d.dot(g) - v * l.dot(g) + f.dot(c) - u.dot(s),
                b = this.computeGiMf();
            return -_ * t - y * n - e * b
        }
        getImpactVelocityAlongNormal() {
            let e = Dp,
                t = Op,
                n = kp,
                r = Ap,
                i = jp;
            return this.bi.position.vadd(this.ri, n), this.bj.position.vadd(this.rj, r), this.bi.getVelocityAtWorldPoint(n, e), this.bj.getVelocityAtWorldPoint(r, t), e.vsub(t, i), this.ni.dot(i)
        }
    },
    wp = new X,
    Tp = new X,
    Ep = new X,
    Dp = new X,
    Op = new X,
    kp = new X,
    Ap = new X,
    jp = new X;
new X, new X, new X, new X, new X, new X, new X, new X, new X, new X;
var Mp = class extends gp {
        constructor(e, t, n) {
            super(e, t, -n, n), this.ri = new X, this.rj = new X, this.t = new X
        }
        computeB(e) {
            this.a;
            let t = this.b;
            this.bi, this.bj;
            let n = this.ri,
                r = this.rj,
                i = Np,
                a = Pp,
                o = this.t;
            n.cross(o, i), r.cross(o, a);
            let s = this.jacobianElementA,
                c = this.jacobianElementB;
            o.negate(s.spatial), i.negate(s.rotational), c.spatial.copy(o), c.rotational.copy(a);
            let l = this.computeGW(),
                u = this.computeGiMf();
            return -l * t - e * u
        }
    },
    Np = new X,
    Pp = new X,
    Fp = class e {
        constructor(t, n, r) {
            r = mp.defaults(r, {
                friction: .3,
                restitution: .3,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e7,
                frictionEquationRelaxation: 3
            }), this.id = e.idCounter++, this.materials = [t, n], this.friction = r.friction, this.restitution = r.restitution, this.contactEquationStiffness = r.contactEquationStiffness, this.contactEquationRelaxation = r.contactEquationRelaxation, this.frictionEquationStiffness = r.frictionEquationStiffness, this.frictionEquationRelaxation = r.frictionEquationRelaxation
        }
    };
Fp.idCounter = 0;
var Ip = class e {
    constructor(t) {
        t === void 0 && (t = {});
        let n = ``;
        typeof t == `string` && (n = t, t = {}), this.name = n, this.id = e.idCounter++, this.friction = t.friction === void 0 ? -1 : t.friction, this.restitution = t.restitution === void 0 ? -1 : t.restitution
    }
};
Ip.idCounter = 0, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new Lf, new X, new X, new X, new X(1, 0, 0), new X(0, 1, 0), new X(0, 0, 1), new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new X;
var Lp = class extends Z {
    constructor(e) {
        if (super({
                type: Z.types.SPHERE
            }), this.radius = e === void 0 ? 1 : e, this.radius < 0) throw Error(`The sphere radius cannot be negative.`);
        this.updateBoundingSphereRadius()
    }
    calculateLocalInertia(e, t) {
        t === void 0 && (t = new X);
        let n = 2 * e * this.radius * this.radius / 5;
        return t.x = n, t.y = n, t.z = n, t
    }
    volume() {
        return 4 * Math.PI * this.radius ** 3 / 3
    }
    updateBoundingSphereRadius() {
        this.boundingSphereRadius = this.radius
    }
    calculateWorldAABB(e, t, n, r) {
        let i = this.radius,
            a = [`x`, `y`, `z`];
        for (let t = 0; t < a.length; t++) {
            let o = a[t];
            n[o] = e[o] - i, r[o] = e[o] + i
        }
    }
};
new X, new X, new X, new X, new X, new X, new X, new X, new X;
var Rp = class extends Z {
        constructor() {
            super({
                type: Z.types.PLANE
            }), this.worldNormal = new X, this.worldNormalNeedsUpdate = !0, this.boundingSphereRadius = Number.MAX_VALUE
        }
        computeWorldNormal(e) {
            let t = this.worldNormal;
            t.set(0, 0, 1), e.vmult(t, t), this.worldNormalNeedsUpdate = !1
        }
        calculateLocalInertia(e, t) {
            return t === void 0 && (t = new X), t
        }
        volume() {
            return Number.MAX_VALUE
        }
        calculateWorldAABB(e, t, n, r) {
            zp.set(0, 0, 1), t.vmult(zp, zp);
            let i = Number.MAX_VALUE;
            n.set(-i, -i, -i), r.set(i, i, i), zp.x === 1 ? r.x = e.x : zp.x === -1 && (n.x = e.x), zp.y === 1 ? r.y = e.y : zp.y === -1 && (n.y = e.y), zp.z === 1 ? r.z = e.z : zp.z === -1 && (n.z = e.z)
        }
        updateBoundingSphereRadius() {
            this.boundingSphereRadius = Number.MAX_VALUE
        }
    },
    zp = new X;
new X, new X, new X, new X, new X, new X, new X, new X, new X, new X, new Vd, new X, new Vd, new X, new X, new X, new X, new X, new X, new X, new Vd, new X, new Xd, new Vd;
var Bp = class {
        constructor() {
            this.equations = []
        }
        solve(e, t) {
            return 0
        }
        addEquation(e) {
            e.enabled && !e.bi.isTrigger && !e.bj.isTrigger && this.equations.push(e)
        }
        removeEquation(e) {
            let t = this.equations,
                n = t.indexOf(e);
            n !== -1 && t.splice(n, 1)
        }
        removeAllEquations() {
            this.equations.length = 0
        }
    },
    Vp = class extends Bp {
        constructor() {
            super(), this.iterations = 10, this.tolerance = 1e-7
        }
        solve(e, t) {
            let n = 0,
                r = this.iterations,
                i = this.tolerance * this.tolerance,
                a = this.equations,
                o = a.length,
                s = t.bodies,
                c = s.length,
                l = e,
                u, d, f, p, m, h;
            if (o !== 0)
                for (let e = 0; e !== c; e++) s[e].updateSolveMassProperties();
            let g = Up,
                _ = Wp,
                v = Hp;
            g.length = o, _.length = o, v.length = o;
            for (let e = 0; e !== o; e++) {
                let t = a[e];
                v[e] = 0, _[e] = t.computeB(l), g[e] = 1 / t.computeC()
            }
            if (o !== 0) {
                for (let e = 0; e !== c; e++) {
                    let t = s[e],
                        n = t.vlambda,
                        r = t.wlambda;
                    n.set(0, 0, 0), r.set(0, 0, 0)
                }
                for (n = 0; n !== r; n++) {
                    p = 0;
                    for (let e = 0; e !== o; e++) {
                        let t = a[e];
                        u = _[e], d = g[e], h = v[e], m = t.computeGWlambda(), f = d * (u - m - t.eps * h), h + f < t.minForce ? f = t.minForce - h : h + f > t.maxForce && (f = t.maxForce - h), v[e] += f, p += f > 0 ? f : -f, t.addToWlambda(f)
                    }
                    if (p * p < i) break
                }
                for (let e = 0; e !== c; e++) {
                    let t = s[e],
                        n = t.velocity,
                        r = t.angularVelocity;
                    t.vlambda.vmul(t.linearFactor, t.vlambda), n.vadd(t.vlambda, n), t.wlambda.vmul(t.angularFactor, t.wlambda), r.vadd(t.wlambda, r)
                }
                let e = a.length,
                    t = 1 / l;
                for (; e--;) a[e].multiplier = v[e] * t
            }
            return n
        }
    },
    Hp = [],
    Up = [],
    Wp = [];
Q.STATIC;
var Gp = class {
        constructor() {
            this.objects = [], this.type = Object
        }
        release() {
            let e = arguments.length;
            for (let t = 0; t !== e; t++) this.objects.push(t < 0 || arguments.length <= t ? void 0 : arguments[t]);
            return this
        }
        get() {
            return this.objects.length === 0 ? this.constructObject() : this.objects.pop()
        }
        constructObject() {
            throw Error(`constructObject() not implemented in this Pool subclass yet!`)
        }
        resize(e) {
            let t = this.objects;
            for (; t.length > e;) t.pop();
            for (; t.length < e;) t.push(this.constructObject());
            return this
        }
    },
    Kp = class extends Gp {
        constructor() {
            super(...arguments), this.type = X
        }
        constructObject() {
            return new X
        }
    },
    qp = {
        sphereSphere: Z.types.SPHERE,
        spherePlane: Z.types.SPHERE | Z.types.PLANE,
        boxBox: Z.types.BOX | Z.types.BOX,
        sphereBox: Z.types.SPHERE | Z.types.BOX,
        planeBox: Z.types.PLANE | Z.types.BOX,
        convexConvex: Z.types.CONVEXPOLYHEDRON,
        sphereConvex: Z.types.SPHERE | Z.types.CONVEXPOLYHEDRON,
        planeConvex: Z.types.PLANE | Z.types.CONVEXPOLYHEDRON,
        boxConvex: Z.types.BOX | Z.types.CONVEXPOLYHEDRON,
        sphereHeightfield: Z.types.SPHERE | Z.types.HEIGHTFIELD,
        boxHeightfield: Z.types.BOX | Z.types.HEIGHTFIELD,
        convexHeightfield: Z.types.CONVEXPOLYHEDRON | Z.types.HEIGHTFIELD,
        sphereParticle: Z.types.PARTICLE | Z.types.SPHERE,
        planeParticle: Z.types.PLANE | Z.types.PARTICLE,
        boxParticle: Z.types.BOX | Z.types.PARTICLE,
        convexParticle: Z.types.PARTICLE | Z.types.CONVEXPOLYHEDRON,
        cylinderCylinder: Z.types.CYLINDER,
        sphereCylinder: Z.types.SPHERE | Z.types.CYLINDER,
        planeCylinder: Z.types.PLANE | Z.types.CYLINDER,
        boxCylinder: Z.types.BOX | Z.types.CYLINDER,
        convexCylinder: Z.types.CONVEXPOLYHEDRON | Z.types.CYLINDER,
        heightfieldCylinder: Z.types.HEIGHTFIELD | Z.types.CYLINDER,
        particleCylinder: Z.types.PARTICLE | Z.types.CYLINDER,
        sphereTrimesh: Z.types.SPHERE | Z.types.TRIMESH,
        planeTrimesh: Z.types.PLANE | Z.types.TRIMESH
    },
    Jp = class {
        get[qp.sphereSphere]() {
            return this.sphereSphere
        }
        get[qp.spherePlane]() {
            return this.spherePlane
        }
        get[qp.boxBox]() {
            return this.boxBox
        }
        get[qp.sphereBox]() {
            return this.sphereBox
        }
        get[qp.planeBox]() {
            return this.planeBox
        }
        get[qp.convexConvex]() {
            return this.convexConvex
        }
        get[qp.sphereConvex]() {
            return this.sphereConvex
        }
        get[qp.planeConvex]() {
            return this.planeConvex
        }
        get[qp.boxConvex]() {
            return this.boxConvex
        }
        get[qp.sphereHeightfield]() {
            return this.sphereHeightfield
        }
        get[qp.boxHeightfield]() {
            return this.boxHeightfield
        }
        get[qp.convexHeightfield]() {
            return this.convexHeightfield
        }
        get[qp.sphereParticle]() {
            return this.sphereParticle
        }
        get[qp.planeParticle]() {
            return this.planeParticle
        }
        get[qp.boxParticle]() {
            return this.boxParticle
        }
        get[qp.convexParticle]() {
            return this.convexParticle
        }
        get[qp.cylinderCylinder]() {
            return this.convexConvex
        }
        get[qp.sphereCylinder]() {
            return this.sphereConvex
        }
        get[qp.planeCylinder]() {
            return this.planeConvex
        }
        get[qp.boxCylinder]() {
            return this.boxConvex
        }
        get[qp.convexCylinder]() {
            return this.convexConvex
        }
        get[qp.heightfieldCylinder]() {
            return this.heightfieldCylinder
        }
        get[qp.particleCylinder]() {
            return this.particleCylinder
        }
        get[qp.sphereTrimesh]() {
            return this.sphereTrimesh
        }
        get[qp.planeTrimesh]() {
            return this.planeTrimesh
        }
        constructor(e) {
            this.contactPointPool = [], this.frictionEquationPool = [], this.result = [], this.frictionResult = [], this.v3pool = new Kp, this.world = e, this.currentContactMaterial = e.defaultContactMaterial, this.enableFrictionReduction = !1
        }
        createContactEquation(e, t, n, r, i, a) {
            let o;
            this.contactPointPool.length ? (o = this.contactPointPool.pop(), o.bi = e, o.bj = t) : o = new Cp(e, t), o.enabled = e.collisionResponse && t.collisionResponse && n.collisionResponse && r.collisionResponse;
            let s = this.currentContactMaterial;
            o.restitution = s.restitution, o.setSpookParams(s.contactEquationStiffness, s.contactEquationRelaxation, this.world.dt);
            let c = n.material || e.material,
                l = r.material || t.material;
            return c && l && c.restitution >= 0 && l.restitution >= 0 && (o.restitution = c.restitution * l.restitution), o.si = i || n, o.sj = a || r, o
        }
        createFrictionEquationsFromContact(e, t) {
            let n = e.bi,
                r = e.bj,
                i = e.si,
                a = e.sj,
                o = this.world,
                s = this.currentContactMaterial,
                c = s.friction,
                l = i.material || n.material,
                u = a.material || r.material;
            if (l && u && l.friction >= 0 && u.friction >= 0 && (c = l.friction * u.friction), c > 0) {
                let i = c * (o.frictionGravity || o.gravity).length(),
                    a = n.invMass + r.invMass;
                a > 0 && (a = 1 / a);
                let l = this.frictionEquationPool,
                    u = l.length ? l.pop() : new Mp(n, r, i * a),
                    d = l.length ? l.pop() : new Mp(n, r, i * a);
                return u.bi = d.bi = n, u.bj = d.bj = r, u.minForce = d.minForce = -i * a, u.maxForce = d.maxForce = i * a, u.ri.copy(e.ri), u.rj.copy(e.rj), d.ri.copy(e.ri), d.rj.copy(e.rj), e.ni.tangents(u.t, d.t), u.setSpookParams(s.frictionEquationStiffness, s.frictionEquationRelaxation, o.dt), d.setSpookParams(s.frictionEquationStiffness, s.frictionEquationRelaxation, o.dt), u.enabled = d.enabled = e.enabled, t.push(u, d), !0
            }
            return !1
        }
        createFrictionFromAverage(e) {
            let t = this.result[this.result.length - 1];
            if (!this.createFrictionEquationsFromContact(t, this.frictionResult) || e === 1) return;
            let n = this.frictionResult[this.frictionResult.length - 2],
                r = this.frictionResult[this.frictionResult.length - 1];
            Yp.setZero(), Xp.setZero(), Zp.setZero();
            let i = t.bi;
            t.bj;
            for (let n = 0; n !== e; n++) t = this.result[this.result.length - 1 - n], t.bi === i ? (Yp.vsub(t.ni, Yp), Xp.vadd(t.rj, Xp), Zp.vadd(t.ri, Zp)) : (Yp.vadd(t.ni, Yp), Xp.vadd(t.ri, Xp), Zp.vadd(t.rj, Zp));
            let a = 1 / e;
            Xp.scale(a, n.ri), Zp.scale(a, n.rj), r.ri.copy(n.ri), r.rj.copy(n.rj), Yp.normalize(), Yp.tangents(n.t, r.t)
        }
        getContacts(e, t, n, r, i, a, o) {
            this.contactPointPool = i, this.frictionEquationPool = o, this.result = r, this.frictionResult = a;
            let s = em,
                c = tm,
                l = Qp,
                u = $p;
            for (let r = 0, i = e.length; r !== i; r++) {
                let i = e[r],
                    a = t[r],
                    o = null;
                i.material && a.material && (o = n.getContactMaterial(i.material, a.material) || null);
                let d = i.type & Q.KINEMATIC && a.type & Q.STATIC || i.type & Q.STATIC && a.type & Q.KINEMATIC || i.type & Q.KINEMATIC && a.type & Q.KINEMATIC;
                for (let e = 0; e < i.shapes.length; e++) {
                    i.quaternion.mult(i.shapeOrientations[e], s), i.quaternion.vmult(i.shapeOffsets[e], l), l.vadd(i.position, l);
                    let t = i.shapes[e];
                    for (let e = 0; e < a.shapes.length; e++) {
                        a.quaternion.mult(a.shapeOrientations[e], c), a.quaternion.vmult(a.shapeOffsets[e], u), u.vadd(a.position, u);
                        let r = a.shapes[e];
                        if (!(t.collisionFilterMask & r.collisionFilterGroup && r.collisionFilterMask & t.collisionFilterGroup) || l.distanceTo(u) > t.boundingSphereRadius + r.boundingSphereRadius) continue;
                        let f = null;
                        t.material && r.material && (f = n.getContactMaterial(t.material, r.material) || null), this.currentContactMaterial = f || o || n.defaultContactMaterial;
                        let p = t.type | r.type,
                            m = this[p];
                        if (m) {
                            let e = !1;
                            e = t.type < r.type ? m.call(this, t, r, l, u, s, c, i, a, t, r, d) : m.call(this, r, t, u, l, c, s, a, i, t, r, d), e && d && (n.shapeOverlapKeeper.set(t.id, r.id), n.bodyOverlapKeeper.set(i.id, a.id))
                        }
                    }
                }
            }
        }
        sphereSphere(e, t, n, r, i, a, o, s, c, l, u) {
            if (u) return n.distanceSquared(r) < (e.radius + t.radius) ** 2;
            let d = this.createContactEquation(o, s, e, t, c, l);
            r.vsub(n, d.ni), d.ni.normalize(), d.ri.copy(d.ni), d.rj.copy(d.ni), d.ri.scale(e.radius, d.ri), d.rj.scale(-t.radius, d.rj), d.ri.vadd(n, d.ri), d.ri.vsub(o.position, d.ri), d.rj.vadd(r, d.rj), d.rj.vsub(s.position, d.rj), this.result.push(d), this.createFrictionEquationsFromContact(d, this.frictionResult)
        }
        spherePlane(e, t, n, r, i, a, o, s, c, l, u) {
            let d = this.createContactEquation(o, s, e, t, c, l);
            if (d.ni.set(0, 0, 1), a.vmult(d.ni, d.ni), d.ni.negate(d.ni), d.ni.normalize(), d.ni.scale(e.radius, d.ri), n.vsub(r, bm), d.ni.scale(d.ni.dot(bm), xm), bm.vsub(xm, d.rj), -bm.dot(d.ni) <= e.radius) {
                if (u) return !0;
                let e = d.ri,
                    t = d.rj;
                e.vadd(n, e), e.vsub(o.position, e), t.vadd(r, t), t.vsub(s.position, t), this.result.push(d), this.createFrictionEquationsFromContact(d, this.frictionResult)
            }
        }
        boxBox(e, t, n, r, i, a, o, s, c, l, u) {
            return e.convexPolyhedronRepresentation.material = e.material, t.convexPolyhedronRepresentation.material = t.material, e.convexPolyhedronRepresentation.collisionResponse = e.collisionResponse, t.convexPolyhedronRepresentation.collisionResponse = t.collisionResponse, this.convexConvex(e.convexPolyhedronRepresentation, t.convexPolyhedronRepresentation, n, r, i, a, o, s, e, t, u)
        }
        sphereBox(e, t, n, r, i, a, o, s, c, l, u) {
            let d = this.v3pool,
                f = Am;
            n.vsub(r, Em), t.getSideNormals(f, a);
            let p = e.radius,
                m = !1,
                h = Mm,
                g = Nm,
                _ = Pm,
                v = null,
                y = 0,
                b = 0,
                x = 0,
                S = null;
            for (let e = 0, t = f.length; e !== t && m === !1; e++) {
                let t = Dm;
                t.copy(f[e]);
                let n = t.length();
                t.normalize();
                let r = Em.dot(t);
                if (r < n + p && r > 0) {
                    let i = Om,
                        a = km;
                    i.copy(f[(e + 1) % 3]), a.copy(f[(e + 2) % 3]);
                    let o = i.length(),
                        s = a.length();
                    i.normalize(), a.normalize();
                    let c = Em.dot(i),
                        l = Em.dot(a);
                    if (c < o && c > -o && l < s && l > -s) {
                        let e = Math.abs(r - n - p);
                        if ((S === null || e < S) && (S = e, b = c, x = l, v = n, h.copy(t), g.copy(i), _.copy(a), y++, u)) return !0
                    }
                }
            }
            if (y) {
                m = !0;
                let i = this.createContactEquation(o, s, e, t, c, l);
                h.scale(-p, i.ri), i.ni.copy(h), i.ni.negate(i.ni), h.scale(v, h), g.scale(b, g), h.vadd(g, h), _.scale(x, _), h.vadd(_, i.rj), i.ri.vadd(n, i.ri), i.ri.vsub(o.position, i.ri), i.rj.vadd(r, i.rj), i.rj.vsub(s.position, i.rj), this.result.push(i), this.createFrictionEquationsFromContact(i, this.frictionResult)
            }
            let C = d.get(),
                w = jm;
            for (let i = 0; i !== 2 && !m; i++)
                for (let a = 0; a !== 2 && !m; a++)
                    for (let d = 0; d !== 2 && !m; d++)
                        if (C.set(0, 0, 0), i ? C.vadd(f[0], C) : C.vsub(f[0], C), a ? C.vadd(f[1], C) : C.vsub(f[1], C), d ? C.vadd(f[2], C) : C.vsub(f[2], C), r.vadd(C, w), w.vsub(n, w), w.lengthSquared() < p * p) {
                            if (u) return !0;
                            m = !0;
                            let i = this.createContactEquation(o, s, e, t, c, l);
                            i.ri.copy(w), i.ri.normalize(), i.ni.copy(i.ri), i.ri.scale(p, i.ri), i.rj.copy(C), i.ri.vadd(n, i.ri), i.ri.vsub(o.position, i.ri), i.rj.vadd(r, i.rj), i.rj.vsub(s.position, i.rj), this.result.push(i), this.createFrictionEquationsFromContact(i, this.frictionResult)
                        } d.release(C), C = null;
            let T = d.get(),
                E = d.get(),
                D = d.get(),
                O = d.get(),
                k = d.get(),
                A = f.length;
            for (let i = 0; i !== A && !m; i++)
                for (let a = 0; a !== A && !m; a++)
                    if (i % 3 != a % 3) {
                        f[a].cross(f[i], T), T.normalize(), f[i].vadd(f[a], E), D.copy(n), D.vsub(E, D), D.vsub(r, D);
                        let d = D.dot(T);
                        T.scale(d, O);
                        let h = 0;
                        for (; h === i % 3 || h === a % 3;) h++;
                        k.copy(n), k.vsub(O, k), k.vsub(E, k), k.vsub(r, k);
                        let g = Math.abs(d),
                            _ = k.length();
                        if (g < f[h].length() && _ < p) {
                            if (u) return !0;
                            m = !0;
                            let i = this.createContactEquation(o, s, e, t, c, l);
                            E.vadd(O, i.rj), i.rj.copy(i.rj), k.negate(i.ni), i.ni.normalize(), i.ri.copy(i.rj), i.ri.vadd(r, i.ri), i.ri.vsub(n, i.ri), i.ri.normalize(), i.ri.scale(p, i.ri), i.ri.vadd(n, i.ri), i.ri.vsub(o.position, i.ri), i.rj.vadd(r, i.rj), i.rj.vsub(s.position, i.rj), this.result.push(i), this.createFrictionEquationsFromContact(i, this.frictionResult)
                        }
                    } d.release(T, E, D, O, k)
        }
        planeBox(e, t, n, r, i, a, o, s, c, l, u) {
            return t.convexPolyhedronRepresentation.material = t.material, t.convexPolyhedronRepresentation.collisionResponse = t.collisionResponse, t.convexPolyhedronRepresentation.id = t.id, this.planeConvex(e, t.convexPolyhedronRepresentation, n, r, i, a, o, s, e, t, u)
        }
        convexConvex(e, t, n, r, i, a, o, s, c, l, u, d, f) {
            let p = Ym;
            if (!(n.distanceTo(r) > e.boundingSphereRadius + t.boundingSphereRadius) && e.findSeparatingAxis(t, n, i, r, a, p, d, f)) {
                let d = [],
                    f = Xm;
                e.clipAgainstHull(n, i, t, r, a, p, -100, 100, d);
                let m = 0;
                for (let i = 0; i !== d.length; i++) {
                    if (u) return !0;
                    let a = this.createContactEquation(o, s, e, t, c, l),
                        h = a.ri,
                        g = a.rj;
                    p.negate(a.ni), d[i].normal.negate(f), f.scale(d[i].depth, f), d[i].point.vadd(f, h), g.copy(d[i].point), h.vsub(n, h), g.vsub(r, g), h.vadd(n, h), h.vsub(o.position, h), g.vadd(r, g), g.vsub(s.position, g), this.result.push(a), m++, this.enableFrictionReduction || this.createFrictionEquationsFromContact(a, this.frictionResult)
                }
                this.enableFrictionReduction && m && this.createFrictionFromAverage(m)
            }
        }
        sphereConvex(e, t, n, r, i, a, o, s, c, l, u) {
            let d = this.v3pool;
            n.vsub(r, Fm);
            let f = t.faceNormals,
                p = t.faces,
                m = t.vertices,
                h = e.radius,
                g = !1;
            for (let i = 0; i !== m.length; i++) {
                let d = m[i],
                    f = zm;
                a.vmult(d, f), r.vadd(f, f);
                let p = Rm;
                if (f.vsub(n, p), p.lengthSquared() < h * h) {
                    if (u) return !0;
                    g = !0;
                    let i = this.createContactEquation(o, s, e, t, c, l);
                    i.ri.copy(p), i.ri.normalize(), i.ni.copy(i.ri), i.ri.scale(h, i.ri), f.vsub(r, i.rj), i.ri.vadd(n, i.ri), i.ri.vsub(o.position, i.ri), i.rj.vadd(r, i.rj), i.rj.vsub(s.position, i.rj), this.result.push(i), this.createFrictionEquationsFromContact(i, this.frictionResult);
                    return
                }
            }
            for (let i = 0, _ = p.length; i !== _ && g === !1; i++) {
                let _ = f[i],
                    v = p[i],
                    y = Bm;
                a.vmult(_, y);
                let b = Vm;
                a.vmult(m[v[0]], b), b.vadd(r, b);
                let x = Hm;
                y.scale(-h, x), n.vadd(x, x);
                let S = Um;
                x.vsub(b, S);
                let C = S.dot(y),
                    w = Wm;
                if (n.vsub(b, w), C < 0 && w.dot(y) > 0) {
                    let i = [];
                    for (let e = 0, t = v.length; e !== t; e++) {
                        let t = d.get();
                        a.vmult(m[v[e]], t), r.vadd(t, t), i.push(t)
                    }
                    if (Tm(i, y, n)) {
                        if (u) return !0;
                        g = !0;
                        let a = this.createContactEquation(o, s, e, t, c, l);
                        y.scale(-h, a.ri), y.negate(a.ni);
                        let f = d.get();
                        y.scale(-C, f);
                        let p = d.get();
                        y.scale(-h, p), n.vsub(r, a.rj), a.rj.vadd(p, a.rj), a.rj.vadd(f, a.rj), a.rj.vadd(r, a.rj), a.rj.vsub(s.position, a.rj), a.ri.vadd(n, a.ri), a.ri.vsub(o.position, a.ri), d.release(f), d.release(p), this.result.push(a), this.createFrictionEquationsFromContact(a, this.frictionResult);
                        for (let e = 0, t = i.length; e !== t; e++) d.release(i[e]);
                        return
                    }
                    for (let f = 0; f !== v.length; f++) {
                        let p = d.get(),
                            g = d.get();
                        a.vmult(m[v[(f + 1) % v.length]], p), a.vmult(m[v[(f + 2) % v.length]], g), r.vadd(p, p), r.vadd(g, g);
                        let _ = Im;
                        g.vsub(p, _);
                        let y = Lm;
                        _.unit(y);
                        let b = d.get(),
                            x = d.get();
                        n.vsub(p, x);
                        let S = x.dot(y);
                        y.scale(S, b), b.vadd(p, b);
                        let C = d.get();
                        if (b.vsub(n, C), S > 0 && S * S < _.lengthSquared() && C.lengthSquared() < h * h) {
                            if (u) return !0;
                            let a = this.createContactEquation(o, s, e, t, c, l);
                            b.vsub(r, a.rj), b.vsub(n, a.ni), a.ni.normalize(), a.ni.scale(h, a.ri), a.rj.vadd(r, a.rj), a.rj.vsub(s.position, a.rj), a.ri.vadd(n, a.ri), a.ri.vsub(o.position, a.ri), this.result.push(a), this.createFrictionEquationsFromContact(a, this.frictionResult);
                            for (let e = 0, t = i.length; e !== t; e++) d.release(i[e]);
                            d.release(p), d.release(g), d.release(b), d.release(C), d.release(x);
                            return
                        }
                        d.release(p), d.release(g), d.release(b), d.release(C), d.release(x)
                    }
                    for (let e = 0, t = i.length; e !== t; e++) d.release(i[e])
                }
            }
        }
        planeConvex(e, t, n, r, i, a, o, s, c, l, u) {
            let d = Gm,
                f = Km;
            f.set(0, 0, 1), i.vmult(f, f);
            let p = 0,
                m = qm;
            for (let i = 0; i !== t.vertices.length; i++)
                if (d.copy(t.vertices[i]), a.vmult(d, d), r.vadd(d, d), d.vsub(n, m), f.dot(m) <= 0) {
                    if (u) return !0;
                    let i = this.createContactEquation(o, s, e, t, c, l),
                        a = Jm;
                    f.scale(f.dot(m), a), d.vsub(a, a), a.vsub(n, i.ri), i.ni.copy(f), d.vsub(r, i.rj), i.ri.vadd(n, i.ri), i.ri.vsub(o.position, i.ri), i.rj.vadd(r, i.rj), i.rj.vsub(s.position, i.rj), this.result.push(i), p++, this.enableFrictionReduction || this.createFrictionEquationsFromContact(i, this.frictionResult)
                } this.enableFrictionReduction && p && this.createFrictionFromAverage(p)
        }
        boxConvex(e, t, n, r, i, a, o, s, c, l, u) {
            return e.convexPolyhedronRepresentation.material = e.material, e.convexPolyhedronRepresentation.collisionResponse = e.collisionResponse, this.convexConvex(e.convexPolyhedronRepresentation, t, n, r, i, a, o, s, e, t, u)
        }
        sphereHeightfield(e, t, n, r, i, a, o, s, c, l, u) {
            let d = t.data,
                f = e.radius,
                p = t.elementSize,
                m = uh,
                h = lh;
            Xd.pointToLocalFrame(r, a, n, h);
            let g = Math.floor((h.x - f) / p) - 1,
                _ = Math.ceil((h.x + f) / p) + 1,
                v = Math.floor((h.y - f) / p) - 1,
                y = Math.ceil((h.y + f) / p) + 1;
            if (_ < 0 || y < 0 || g > d.length || v > d[0].length) return;
            g < 0 && (g = 0), _ < 0 && (_ = 0), v < 0 && (v = 0), y < 0 && (y = 0), g >= d.length && (g = d.length - 1), _ >= d.length && (_ = d.length - 1), y >= d[0].length && (y = d[0].length - 1), v >= d[0].length && (v = d[0].length - 1);
            let b = [];
            t.getRectMinMax(g, v, _, y, b);
            let x = b[0],
                S = b[1];
            if (h.z - f > S || h.z + f < x) return;
            let C = this.result;
            for (let c = g; c < _; c++)
                for (let l = v; l < y; l++) {
                    let d = C.length,
                        f = !1;
                    if (t.getConvexTrianglePillar(c, l, !1), Xd.pointToWorldFrame(r, a, t.pillarOffset, m), n.distanceTo(m) < t.pillarConvex.boundingSphereRadius + e.boundingSphereRadius && (f = this.sphereConvex(e, t.pillarConvex, n, m, i, a, o, s, e, t, u)), u && f || (t.getConvexTrianglePillar(c, l, !0), Xd.pointToWorldFrame(r, a, t.pillarOffset, m), n.distanceTo(m) < t.pillarConvex.boundingSphereRadius + e.boundingSphereRadius && (f = this.sphereConvex(e, t.pillarConvex, n, m, i, a, o, s, e, t, u)), u && f)) return !0;
                    if (C.length - d > 2) return
                }
        }
        boxHeightfield(e, t, n, r, i, a, o, s, c, l, u) {
            return e.convexPolyhedronRepresentation.material = e.material, e.convexPolyhedronRepresentation.collisionResponse = e.collisionResponse, this.convexHeightfield(e.convexPolyhedronRepresentation, t, n, r, i, a, o, s, e, t, u)
        }
        convexHeightfield(e, t, n, r, i, a, o, s, c, l, u) {
            let d = t.data,
                f = t.elementSize,
                p = e.boundingSphereRadius,
                m = sh,
                h = ch,
                g = oh;
            Xd.pointToLocalFrame(r, a, n, g);
            let _ = Math.floor((g.x - p) / f) - 1,
                v = Math.ceil((g.x + p) / f) + 1,
                y = Math.floor((g.y - p) / f) - 1,
                b = Math.ceil((g.y + p) / f) + 1;
            if (v < 0 || b < 0 || _ > d.length || y > d[0].length) return;
            _ < 0 && (_ = 0), v < 0 && (v = 0), y < 0 && (y = 0), b < 0 && (b = 0), _ >= d.length && (_ = d.length - 1), v >= d.length && (v = d.length - 1), b >= d[0].length && (b = d[0].length - 1), y >= d[0].length && (y = d[0].length - 1);
            let x = [];
            t.getRectMinMax(_, y, v, b, x);
            let S = x[0],
                C = x[1];
            if (!(g.z - p > C || g.z + p < S))
                for (let c = _; c < v; c++)
                    for (let l = y; l < b; l++) {
                        let d = !1;
                        if (t.getConvexTrianglePillar(c, l, !1), Xd.pointToWorldFrame(r, a, t.pillarOffset, m), n.distanceTo(m) < t.pillarConvex.boundingSphereRadius + e.boundingSphereRadius && (d = this.convexConvex(e, t.pillarConvex, n, m, i, a, o, s, null, null, u, h, null)), u && d || (t.getConvexTrianglePillar(c, l, !0), Xd.pointToWorldFrame(r, a, t.pillarOffset, m), n.distanceTo(m) < t.pillarConvex.boundingSphereRadius + e.boundingSphereRadius && (d = this.convexConvex(e, t.pillarConvex, n, m, i, a, o, s, null, null, u, h, null)), u && d)) return !0
                    }
        }
        sphereParticle(e, t, n, r, i, a, o, s, c, l, u) {
            let d = eh;
            if (d.set(0, 0, 1), r.vsub(n, d), d.lengthSquared() <= e.radius * e.radius) {
                if (u) return !0;
                let n = this.createContactEquation(s, o, t, e, c, l);
                d.normalize(), n.rj.copy(d), n.rj.scale(e.radius, n.rj), n.ni.copy(d), n.ni.negate(n.ni), n.ri.set(0, 0, 0), this.result.push(n), this.createFrictionEquationsFromContact(n, this.frictionResult)
            }
        }
        planeParticle(e, t, n, r, i, a, o, s, c, l, u) {
            let d = Zm;
            d.set(0, 0, 1), o.quaternion.vmult(d, d);
            let f = Qm;
            if (r.vsub(o.position, f), d.dot(f) <= 0) {
                if (u) return !0;
                let n = this.createContactEquation(s, o, t, e, c, l);
                n.ni.copy(d), n.ni.negate(n.ni), n.ri.set(0, 0, 0);
                let i = $m;
                d.scale(d.dot(r), i), r.vsub(i, i), n.rj.copy(i), this.result.push(n), this.createFrictionEquationsFromContact(n, this.frictionResult)
            }
        }
        boxParticle(e, t, n, r, i, a, o, s, c, l, u) {
            return e.convexPolyhedronRepresentation.material = e.material, e.convexPolyhedronRepresentation.collisionResponse = e.collisionResponse, this.convexParticle(e.convexPolyhedronRepresentation, t, n, r, i, a, o, s, e, t, u)
        }
        convexParticle(e, t, n, r, i, a, o, s, c, l, u) {
            let d = -1,
                f = rh,
                p = ah,
                m = null,
                h = nh;
            if (h.copy(r), h.vsub(n, h), i.conjugate(th), th.vmult(h, h), e.pointIsInside(h)) {
                e.worldVerticesNeedsUpdate && e.computeWorldVertices(n, i), e.worldFaceNormalsNeedsUpdate && e.computeWorldFaceNormals(i);
                for (let t = 0, n = e.faces.length; t !== n; t++) {
                    let n = [e.worldVertices[e.faces[t][0]]],
                        i = e.worldFaceNormals[t];
                    r.vsub(n[0], ih);
                    let a = -i.dot(ih);
                    if (m === null || Math.abs(a) < Math.abs(m)) {
                        if (u) return !0;
                        m = a, d = t, f.copy(i)
                    }
                }
                if (d !== -1) {
                    let i = this.createContactEquation(s, o, t, e, c, l);
                    f.scale(m, p), p.vadd(r, p), p.vsub(n, p), i.rj.copy(p), f.negate(i.ni), i.ri.set(0, 0, 0);
                    let a = i.ri,
                        u = i.rj;
                    a.vadd(r, a), a.vsub(s.position, a), u.vadd(n, u), u.vsub(o.position, u), this.result.push(i), this.createFrictionEquationsFromContact(i, this.frictionResult)
                } else console.warn(`Point found inside convex, but did not find penetrating face!`)
            }
        }
        heightfieldCylinder(e, t, n, r, i, a, o, s, c, l, u) {
            return this.convexHeightfield(t, e, r, n, a, i, s, o, c, l, u)
        }
        particleCylinder(e, t, n, r, i, a, o, s, c, l, u) {
            return this.convexParticle(t, e, r, n, a, i, s, o, c, l, u)
        }
        sphereTrimesh(e, t, n, r, i, a, o, s, c, l, u) {
            let d = lm,
                f = um,
                p = dm,
                m = fm,
                h = pm,
                g = mm,
                _ = vm,
                v = cm,
                y = om,
                b = ym;
            Xd.pointToLocalFrame(r, a, n, h);
            let x = e.radius;
            _.lowerBound.set(h.x - x, h.y - x, h.z - x), _.upperBound.set(h.x + x, h.y + x, h.z + x), t.getTrianglesInAABB(_, b);
            let S = sm,
                C = e.radius * e.radius;
            for (let i = 0; i < b.length; i++)
                for (let d = 0; d < 3; d++)
                    if (t.getVertex(t.indices[b[i] * 3 + d], S), S.vsub(h, y), y.lengthSquared() <= C) {
                        if (v.copy(S), Xd.pointToWorldFrame(r, a, v, S), S.vsub(n, y), u) return !0;
                        let i = this.createContactEquation(o, s, e, t, c, l);
                        i.ni.copy(y), i.ni.normalize(), i.ri.copy(i.ni), i.ri.scale(e.radius, i.ri), i.ri.vadd(n, i.ri), i.ri.vsub(o.position, i.ri), i.rj.copy(S), i.rj.vsub(s.position, i.rj), this.result.push(i), this.createFrictionEquationsFromContact(i, this.frictionResult)
                    } for (let i = 0; i < b.length; i++)
                for (let _ = 0; _ < 3; _++) {
                    t.getVertex(t.indices[b[i] * 3 + _], d), t.getVertex(t.indices[b[i] * 3 + (_ + 1) % 3], f), f.vsub(d, p), h.vsub(f, g);
                    let v = g.dot(p);
                    h.vsub(d, g);
                    let y = g.dot(p);
                    if (y > 0 && v < 0 && (h.vsub(d, g), m.copy(p), m.normalize(), y = g.dot(m), m.scale(y, g), g.vadd(d, g), g.distanceTo(h) < e.radius)) {
                        if (u) return !0;
                        let i = this.createContactEquation(o, s, e, t, c, l);
                        g.vsub(h, i.ni), i.ni.normalize(), i.ni.scale(e.radius, i.ri), i.ri.vadd(n, i.ri), i.ri.vsub(o.position, i.ri), Xd.pointToWorldFrame(r, a, g, g), g.vsub(s.position, i.rj), Xd.vectorToWorldFrame(a, i.ni, i.ni), Xd.vectorToWorldFrame(a, i.ri, i.ri), this.result.push(i), this.createFrictionEquationsFromContact(i, this.frictionResult)
                    }
                }
            let w = hm,
                T = gm,
                E = _m,
                D = am;
            for (let i = 0, d = b.length; i !== d; i++) {
                t.getTriangleVertices(b[i], w, T, E), t.getNormal(b[i], D), h.vsub(w, g);
                let d = g.dot(D);
                if (D.scale(d, g), h.vsub(g, g), d = g.distanceTo(h), Lf.pointInTriangle(g, w, T, E) && d < e.radius) {
                    if (u) return !0;
                    let i = this.createContactEquation(o, s, e, t, c, l);
                    g.vsub(h, i.ni), i.ni.normalize(), i.ni.scale(e.radius, i.ri), i.ri.vadd(n, i.ri), i.ri.vsub(o.position, i.ri), Xd.pointToWorldFrame(r, a, g, g), g.vsub(s.position, i.rj), Xd.vectorToWorldFrame(a, i.ni, i.ni), Xd.vectorToWorldFrame(a, i.ri, i.ri), this.result.push(i), this.createFrictionEquationsFromContact(i, this.frictionResult)
                }
            }
            b.length = 0
        }
        planeTrimesh(e, t, n, r, i, a, o, s, c, l, u) {
            let d = new X,
                f = nm;
            f.set(0, 0, 1), i.vmult(f, f);
            for (let i = 0; i < t.vertices.length / 3; i++) {
                t.getVertex(i, d);
                let p = new X;
                p.copy(d), Xd.pointToWorldFrame(r, a, p, d);
                let m = rm;
                if (d.vsub(n, m), f.dot(m) <= 0) {
                    if (u) return !0;
                    let n = this.createContactEquation(o, s, e, t, c, l);
                    n.ni.copy(f);
                    let r = im;
                    f.scale(m.dot(f), r), d.vsub(r, r), n.ri.copy(r), n.ri.vsub(o.position, n.ri), n.rj.copy(d), n.rj.vsub(s.position, n.rj), this.result.push(n), this.createFrictionEquationsFromContact(n, this.frictionResult)
                }
            }
        }
    },
    Yp = new X,
    Xp = new X,
    Zp = new X,
    Qp = new X,
    $p = new X,
    em = new Kd,
    tm = new Kd,
    nm = new X,
    rm = new X,
    im = new X,
    am = new X,
    om = new X;
new X;
var sm = new X,
    cm = new X,
    lm = new X,
    um = new X,
    dm = new X,
    fm = new X,
    pm = new X,
    mm = new X,
    hm = new X,
    gm = new X,
    _m = new X,
    vm = new Vd,
    ym = [],
    bm = new X,
    xm = new X,
    Sm = new X,
    Cm = new X,
    wm = new X;

function Tm(e, t, n) {
    let r = null,
        i = e.length;
    for (let a = 0; a !== i; a++) {
        let o = e[a],
            s = Sm;
        e[(a + 1) % i].vsub(o, s);
        let c = Cm;
        s.cross(t, c);
        let l = wm;
        n.vsub(o, l);
        let u = c.dot(l);
        if (r === null || u > 0 && r === !0 || u <= 0 && r === !1) r === null && (r = u > 0);
        else return !1
    }
    return !0
}
var Em = new X,
    Dm = new X,
    Om = new X,
    km = new X,
    Am = [new X, new X, new X, new X, new X, new X],
    jm = new X,
    Mm = new X,
    Nm = new X,
    Pm = new X,
    Fm = new X,
    Im = new X,
    Lm = new X,
    Rm = new X,
    zm = new X,
    Bm = new X,
    Vm = new X,
    Hm = new X,
    Um = new X,
    Wm = new X;
new X, new X;
var Gm = new X,
    Km = new X,
    qm = new X,
    Jm = new X,
    Ym = new X,
    Xm = new X,
    Zm = new X,
    Qm = new X,
    $m = new X,
    eh = new X,
    th = new Kd,
    nh = new X;
new X;
var rh = new X,
    ih = new X,
    ah = new X,
    oh = new X,
    sh = new X,
    ch = [0],
    lh = new X,
    uh = new X,
    dh = class {
        constructor() {
            this.current = [], this.previous = []
        }
        getKey(e, t) {
            if (t < e) {
                let n = t;
                t = e, e = n
            }
            return e << 16 | t
        }
        set(e, t) {
            let n = this.getKey(e, t),
                r = this.current,
                i = 0;
            for (; n > r[i];) i++;
            if (n !== r[i]) {
                for (let e = r.length - 1; e >= i; e--) r[e + 1] = r[e];
                r[i] = n
            }
        }
        tick() {
            let e = this.current;
            this.current = this.previous, this.previous = e, this.current.length = 0
        }
        getDiff(e, t) {
            let n = this.current,
                r = this.previous,
                i = n.length,
                a = r.length,
                o = 0;
            for (let t = 0; t < i; t++) {
                let i = !1,
                    a = n[t];
                for (; a > r[o];) o++;
                i = a === r[o], i || fh(e, a)
            }
            o = 0;
            for (let e = 0; e < a; e++) {
                let i = !1,
                    a = r[e];
                for (; a > n[o];) o++;
                i = n[o] === a, i || fh(t, a)
            }
        }
    };

function fh(e, t) {
    e.push((t & 4294901760) >> 16, t & 65535)
}
var ph = (e, t) => e < t ? `${e}-${t}` : `${t}-${e}`,
    mh = class {
        constructor() {
            this.data = {
                keys: []
            }
        }
        get(e, t) {
            let n = ph(e, t);
            return this.data[n]
        }
        set(e, t, n) {
            let r = ph(e, t);
            this.get(e, t) || this.data.keys.push(r), this.data[r] = n
        }
        delete(e, t) {
            let n = ph(e, t),
                r = this.data.keys.indexOf(n);
            r !== -1 && this.data.keys.splice(r, 1), delete this.data[n]
        }
        reset() {
            let e = this.data,
                t = e.keys;
            for (; t.length > 0;) {
                let n = t.pop();
                delete e[n]
            }
        }
    },
    hh = class extends Gd {
        constructor(e) {
            e === void 0 && (e = {}), super(), this.dt = -1, this.allowSleep = !!e.allowSleep, this.contacts = [], this.frictionEquations = [], this.quatNormalizeSkip = e.quatNormalizeSkip === void 0 ? 0 : e.quatNormalizeSkip, this.quatNormalizeFast = e.quatNormalizeFast !== void 0 && e.quatNormalizeFast, this.time = 0, this.stepnumber = 0, this.default_dt = 1 / 60, this.nextId = 0, this.gravity = new X, e.gravity && this.gravity.copy(e.gravity), e.frictionGravity && (this.frictionGravity = new X, this.frictionGravity.copy(e.frictionGravity)), this.broadphase = e.broadphase === void 0 ? new Df : e.broadphase, this.bodies = [], this.hasActiveBodies = !1, this.solver = e.solver === void 0 ? new Vp : e.solver, this.constraints = [], this.narrowphase = new Jp(this), this.collisionMatrix = new Wd, this.collisionMatrixPrevious = new Wd, this.bodyOverlapKeeper = new dh, this.shapeOverlapKeeper = new dh, this.contactmaterials = [], this.contactMaterialTable = new mh, this.defaultMaterial = new Ip(`default`), this.defaultContactMaterial = new Fp(this.defaultMaterial, this.defaultMaterial, {
                friction: .3,
                restitution: 0
            }), this.doProfiling = !1, this.profile = {
                solve: 0,
                makeContactConstraints: 0,
                broadphase: 0,
                integrate: 0,
                narrowphase: 0
            }, this.accumulator = 0, this.subsystems = [], this.addBodyEvent = {
                type: `addBody`,
                body: null
            }, this.removeBodyEvent = {
                type: `removeBody`,
                body: null
            }, this.idToBodyMap = {}, this.broadphase.setWorld(this)
        }
        getContactMaterial(e, t) {
            return this.contactMaterialTable.get(e.id, t.id)
        }
        collisionMatrixTick() {
            let e = this.collisionMatrixPrevious;
            this.collisionMatrixPrevious = this.collisionMatrix, this.collisionMatrix = e, this.collisionMatrix.reset(), this.bodyOverlapKeeper.tick(), this.shapeOverlapKeeper.tick()
        }
        addConstraint(e) {
            this.constraints.push(e)
        }
        removeConstraint(e) {
            let t = this.constraints.indexOf(e);
            t !== -1 && this.constraints.splice(t, 1)
        }
        rayTest(e, t, n) {
            n instanceof Of ? this.raycastClosest(e, t, {
                skipBackfaces: !0
            }, n) : this.raycastAll(e, t, {
                skipBackfaces: !0
            }, n)
        }
        raycastAll(e, t, n, r) {
            return n === void 0 && (n = {}), n.mode = Lf.ALL, n.from = e, n.to = t, n.callback = r, gh.intersectWorld(this, n)
        }
        raycastAny(e, t, n, r) {
            return n === void 0 && (n = {}), n.mode = Lf.ANY, n.from = e, n.to = t, n.result = r, gh.intersectWorld(this, n)
        }
        raycastClosest(e, t, n, r) {
            return n === void 0 && (n = {}), n.mode = Lf.CLOSEST, n.from = e, n.to = t, n.result = r, gh.intersectWorld(this, n)
        }
        addBody(e) {
            this.bodies.includes(e) || (e.index = this.bodies.length, this.bodies.push(e), e.world = this, e.initPosition.copy(e.position), e.initVelocity.copy(e.velocity), e.timeLastSleepy = this.time, e instanceof Q && (e.initAngularVelocity.copy(e.angularVelocity), e.initQuaternion.copy(e.quaternion)), this.collisionMatrix.setNumObjects(this.bodies.length), this.addBodyEvent.body = e, this.idToBodyMap[e.id] = e, this.dispatchEvent(this.addBodyEvent))
        }
        removeBody(e) {
            e.world = null;
            let t = this.bodies.length - 1,
                n = this.bodies,
                r = n.indexOf(e);
            if (r !== -1) {
                n.splice(r, 1);
                for (let e = 0; e !== n.length; e++) n[e].index = e;
                this.collisionMatrix.setNumObjects(t), this.removeBodyEvent.body = e, delete this.idToBodyMap[e.id], this.dispatchEvent(this.removeBodyEvent)
            }
        }
        getBodyById(e) {
            return this.idToBodyMap[e]
        }
        getShapeById(e) {
            let t = this.bodies;
            for (let n = 0; n < t.length; n++) {
                let r = t[n].shapes;
                for (let t = 0; t < r.length; t++) {
                    let n = r[t];
                    if (n.id === e) return n
                }
            }
            return null
        }
        addContactMaterial(e) {
            this.contactmaterials.push(e), this.contactMaterialTable.set(e.materials[0].id, e.materials[1].id, e)
        }
        removeContactMaterial(e) {
            let t = this.contactmaterials.indexOf(e);
            t !== -1 && (this.contactmaterials.splice(t, 1), this.contactMaterialTable.delete(e.materials[0].id, e.materials[1].id))
        }
        fixedStep(e, t) {
            e === void 0 && (e = 1 / 60), t === void 0 && (t = 10);
            let n = _h.now() / 1e3;
            if (!this.lastCallTime) this.step(e, void 0, t);
            else {
                let r = n - this.lastCallTime;
                this.step(e, r, t)
            }
            this.lastCallTime = n
        }
        step(e, t, n) {
            if (n === void 0 && (n = 10), t === void 0) this.internalStep(e), this.time += e;
            else {
                this.accumulator += t;
                let r = _h.now(),
                    i = 0;
                for (; this.accumulator >= e && i < n && (this.internalStep(e), this.accumulator -= e, i++, !(_h.now() - r > e * 1e3)););
                this.accumulator %= e;
                let a = this.accumulator / e;
                for (let e = 0; e !== this.bodies.length; e++) {
                    let t = this.bodies[e];
                    t.previousPosition.lerp(t.position, a, t.interpolatedPosition), t.previousQuaternion.slerp(t.quaternion, a, t.interpolatedQuaternion), t.previousQuaternion.normalize()
                }
                this.time += t
            }
        }
        internalStep(e) {
            this.dt = e;
            let t = this.contacts,
                n = Ch,
                r = wh,
                i = this.bodies.length,
                a = this.bodies,
                o = this.solver,
                s = this.gravity,
                c = this.doProfiling,
                l = this.profile,
                u = Q.DYNAMIC,
                d = -1 / 0,
                f = this.constraints,
                p = Sh;
            s.length();
            let m = s.x,
                h = s.y,
                g = s.z,
                _ = 0;
            for (c && (d = _h.now()), _ = 0; _ !== i; _++) {
                let e = a[_];
                if (e.type === u) {
                    let t = e.force,
                        n = e.mass;
                    t.x += n * m, t.y += n * h, t.z += n * g
                }
            }
            for (let e = 0, t = this.subsystems.length; e !== t; e++) this.subsystems[e].update();
            c && (d = _h.now()), n.length = 0, r.length = 0, this.broadphase.collisionPairs(this, n, r), c && (l.broadphase = _h.now() - d);
            let v = f.length;
            for (_ = 0; _ !== v; _++) {
                let e = f[_];
                if (!e.collideConnected)
                    for (let t = n.length - 1; t >= 0; --t)(e.bodyA === n[t] && e.bodyB === r[t] || e.bodyB === n[t] && e.bodyA === r[t]) && (n.splice(t, 1), r.splice(t, 1))
            }
            this.collisionMatrixTick(), c && (d = _h.now());
            let y = xh,
                b = t.length;
            for (_ = 0; _ !== b; _++) y.push(t[_]);
            t.length = 0;
            let x = this.frictionEquations.length;
            for (_ = 0; _ !== x; _++) p.push(this.frictionEquations[_]);
            for (this.frictionEquations.length = 0, this.narrowphase.getContacts(n, r, this, t, y, this.frictionEquations, p), c && (l.narrowphase = _h.now() - d), c && (d = _h.now()), _ = 0; _ < this.frictionEquations.length; _++) o.addEquation(this.frictionEquations[_]);
            let S = t.length;
            for (let e = 0; e !== S; e++) {
                let n = t[e],
                    r = n.bi,
                    i = n.bj,
                    a = n.si,
                    s = n.sj,
                    c;
                c = r.material && i.material && this.getContactMaterial(r.material, i.material) || this.defaultContactMaterial, c.friction, r.material && i.material && (r.material.friction >= 0 && i.material.friction >= 0 && r.material.friction * i.material.friction, r.material.restitution >= 0 && i.material.restitution >= 0 && (n.restitution = r.material.restitution * i.material.restitution)), o.addEquation(n), r.allowSleep && r.type === Q.DYNAMIC && r.sleepState === Q.SLEEPING && i.sleepState === Q.AWAKE && i.type !== Q.STATIC && i.velocity.lengthSquared() + i.angularVelocity.lengthSquared() >= i.sleepSpeedLimit ** 2 * 2 && (r.wakeUpAfterNarrowphase = !0), i.allowSleep && i.type === Q.DYNAMIC && i.sleepState === Q.SLEEPING && r.sleepState === Q.AWAKE && r.type !== Q.STATIC && r.velocity.lengthSquared() + r.angularVelocity.lengthSquared() >= r.sleepSpeedLimit ** 2 * 2 && (i.wakeUpAfterNarrowphase = !0), this.collisionMatrix.set(r, i, !0), this.collisionMatrixPrevious.get(r, i) || (bh.body = i, bh.contact = n, r.dispatchEvent(bh), bh.body = r, i.dispatchEvent(bh)), this.bodyOverlapKeeper.set(r.id, i.id), this.shapeOverlapKeeper.set(a.id, s.id)
            }
            for (this.emitContactEvents(), c && (l.makeContactConstraints = _h.now() - d, d = _h.now()), _ = 0; _ !== i; _++) {
                let e = a[_];
                e.wakeUpAfterNarrowphase &&= (e.wakeUp(), !1)
            }
            for (v = f.length, _ = 0; _ !== v; _++) {
                let e = f[_];
                e.update();
                for (let t = 0, n = e.equations.length; t !== n; t++) {
                    let n = e.equations[t];
                    o.addEquation(n)
                }
            }
            o.solve(e, this), c && (l.solve = _h.now() - d), o.removeAllEquations();
            let C = Math.pow;
            for (_ = 0; _ !== i; _++) {
                let t = a[_];
                if (t.type & u) {
                    let n = C(1 - t.linearDamping, e),
                        r = t.velocity;
                    r.scale(n, r);
                    let i = t.angularVelocity;
                    if (i) {
                        let n = C(1 - t.angularDamping, e);
                        i.scale(n, i)
                    }
                }
            }
            this.dispatchEvent(yh), c && (d = _h.now());
            let w = this.stepnumber % (this.quatNormalizeSkip + 1) === 0,
                T = this.quatNormalizeFast;
            for (_ = 0; _ !== i; _++) a[_].integrate(e, w, T);
            this.clearForces(), this.broadphase.dirty = !0, c && (l.integrate = _h.now() - d), this.stepnumber += 1, this.dispatchEvent(vh);
            let E = !0;
            if (this.allowSleep)
                for (E = !1, _ = 0; _ !== i; _++) {
                    let e = a[_];
                    e.sleepTick(this.time), e.sleepState !== Q.SLEEPING && (E = !0)
                }
            this.hasActiveBodies = E
        }
        emitContactEvents() {
            let e = this.hasAnyEventListener(`beginContact`),
                t = this.hasAnyEventListener(`endContact`);
            if ((e || t) && this.bodyOverlapKeeper.getDiff(Th, Eh), e) {
                for (let e = 0, t = Th.length; e < t; e += 2) Dh.bodyA = this.getBodyById(Th[e]), Dh.bodyB = this.getBodyById(Th[e + 1]), this.dispatchEvent(Dh);
                Dh.bodyA = Dh.bodyB = null
            }
            if (t) {
                for (let e = 0, t = Eh.length; e < t; e += 2) Oh.bodyA = this.getBodyById(Eh[e]), Oh.bodyB = this.getBodyById(Eh[e + 1]), this.dispatchEvent(Oh);
                Oh.bodyA = Oh.bodyB = null
            }
            Th.length = Eh.length = 0;
            let n = this.hasAnyEventListener(`beginShapeContact`),
                r = this.hasAnyEventListener(`endShapeContact`);
            if ((n || r) && this.shapeOverlapKeeper.getDiff(Th, Eh), n) {
                for (let e = 0, t = Th.length; e < t; e += 2) {
                    let t = this.getShapeById(Th[e]),
                        n = this.getShapeById(Th[e + 1]);
                    kh.shapeA = t, kh.shapeB = n, t && (kh.bodyA = t.body), n && (kh.bodyB = n.body), this.dispatchEvent(kh)
                }
                kh.bodyA = kh.bodyB = kh.shapeA = kh.shapeB = null
            }
            if (r) {
                for (let e = 0, t = Eh.length; e < t; e += 2) {
                    let t = this.getShapeById(Eh[e]),
                        n = this.getShapeById(Eh[e + 1]);
                    Ah.shapeA = t, Ah.shapeB = n, t && (Ah.bodyA = t.body), n && (Ah.bodyB = n.body), this.dispatchEvent(Ah)
                }
                Ah.bodyA = Ah.bodyB = Ah.shapeA = Ah.shapeB = null
            }
        }
        clearForces() {
            let e = this.bodies,
                t = e.length;
            for (let n = 0; n !== t; n++) {
                let t = e[n];
                t.force, t.torque, t.force.set(0, 0, 0), t.torque.set(0, 0, 0)
            }
        }
    };
new Vd;
var gh = new Lf,
    _h = globalThis.performance || {};
if (!_h.now) {
    let e = Date.now();
    _h.timing && _h.timing.navigationStart && (e = _h.timing.navigationStart), _h.now = () => Date.now() - e
}
new X;
var vh = {
        type: `postStep`
    },
    yh = {
        type: `preStep`
    },
    bh = {
        type: Q.COLLIDE_EVENT_NAME,
        body: null,
        contact: null
    },
    xh = [],
    Sh = [],
    Ch = [],
    wh = [],
    Th = [],
    Eh = [],
    Dh = {
        type: `beginContact`,
        bodyA: null,
        bodyB: null
    },
    Oh = {
        type: `endContact`,
        bodyA: null,
        bodyB: null
    },
    kh = {
        type: `beginShapeContact`,
        bodyA: null,
        bodyB: null,
        shapeA: null,
        shapeB: null
    },
    Ah = {
        type: `endShapeContact`,
        bodyA: null,
        bodyB: null,
        shapeA: null,
        shapeB: null
    },
    jh = new X(1, .92, 2.66),
    Mh = .95,
    Nh = new U,
    Ph = new U,
    Fh = new Dt,
    Ih = class {
        scene;
        car;
        barrierBlocks;
        effects;
        callbacks;
        active = !1;
        world = null;
        carBody = null;
        debris = [];
        wheels = [];
        barrierBodies = [];
        barrierHome = new Map;
        lastImpactAt = 0;
        time = 0;
        focusVec = new U;
        shardGeo = new Ti(1, 1, 1);
        shardMats;
        constructor(e, t, n, r, i) {
            this.scene = e, this.car = t, this.barrierBlocks = n, this.effects = r, this.callbacks = i;
            for (let e of n) this.barrierHome.set(e, {
                p: e.position.clone(),
                q: e.quaternion.clone()
            });
            this.shardMats = [t.materials.caliper, t.materials.darkMetal, t.materials.goldPaint, t.materials.blackPaint]
        }
        get focus() {
            if (!this.carBody) return this.car.root.position;
            let e = this.carBody.position;
            return this.focusVec.set(e.x, e.y, e.z)
        }
        begin(e, t) {
            this.reset(), this.active = !0, this.time = 0;
            let n = new hh({
                gravity: new X(0, -9.82, 0)
            });
            n.allowSleep = !0, n.broadphase = new pp(n), n.defaultContactMaterial.friction = .42, n.defaultContactMaterial.restitution = .18, this.world = n;
            let r = new Q({
                type: Q.STATIC,
                shape: new Rp
            });
            r.quaternion.setFromEuler(-Math.PI / 2, 0, 0), n.addBody(r);
            let i = this.car.root,
                a = Pd.track.roadWidth / 2 + 1.1;
            for (let e of [-1, 1]) {
                let t = new Q({
                    type: Q.STATIC,
                    shape: new rf(new X(.1, .42, 300)),
                    position: new X(e * a, .42, i.position.z - 250)
                });
                n.addBody(t)
            }
            let o = new Q({
                mass: Pd.car.massKg,
                shape: new rf(jh),
                position: new X(i.position.x, Mh, i.position.z),
                linearDamping: .04,
                angularDamping: .08
            });
            if (o.quaternion.set(i.quaternion.x, i.quaternion.y, i.quaternion.z, i.quaternion.w), o.velocity.set(0, 0, -t), n.addBody(o), this.carBody = o, e === `brake_snap`) {
                let e = Math.min(1, t / 50);
                o.velocity.set(2.6 * e, 4.8 * e + 1.5, -t * .9), o.angularVelocity.set(-1.6 * e, .9 * e, 5.6 * e + 1.2), this.detachWheel(0, new U(-5, 3, -t * .75)), this.spawnBrakeShards(t)
            } else {
                o.velocity.y = 1.2, o.angularVelocity.set(-.6, .3, 1.6);
                for (let e of this.barrierBlocks) {
                    let t = new Q({
                        mass: 650,
                        shape: new rf(new X(.95, .5, .35)),
                        position: new X(e.position.x, e.position.y, e.position.z)
                    });
                    n.addBody(t), this.barrierBodies.push({
                        mesh: e,
                        body: t
                    })
                }
            }
            o.addEventListener(`collide`, e => {
                let t = Math.abs(e.contact.getImpactVelocityAlongNormal());
                if (t < 2.5 || this.time - this.lastImpactAt < .12) return;
                this.lastImpactAt = this.time;
                let n = e.contact.bi === o ? e.contact.ri : e.contact.rj,
                    r = new U(o.position.x + n.x, o.position.y + n.y, o.position.z + n.z),
                    i = Math.min(1, t / 14);
                this.burst(r, i, o.velocity), i > .5 && this.wheels.length < 2 && this.detachWheel(3, new U(4, 4, o.velocity.z * .6)), this.callbacks.onImpact(i, r)
            }), this.burst(new U(i.position.x, .6, i.position.z - 1.6), 1, o.velocity)
        }
        burst(e, t, n) {
            let r = Math.floor(20 + t * 70);
            for (let i = 0; i < r; i++) Nh.set(n.x * .5 + (Math.random() - .5) * 10, Math.random() * 7 * t + 1, n.z * .5 + (Math.random() - .5) * 10), this.effects.sparks.emit(e, Nh, .05 + Math.random() * .05, .5 + Math.random() * .7);
            for (let t = 0; t < r * 1.5; t++) Nh.set(n.x * .6 + (Math.random() - .5) * 8, Math.random() * 6, n.z * .6 + (Math.random() - .5) * 8), this.effects.glass.emit(e, Nh, .035, 1.6 + Math.random() * 1.6, .9);
            for (let n = 0; n < 6 + t * 14; n++) Nh.set((Math.random() - .5) * 3, Math.random() * 1.5, (Math.random() - .5) * 3), this.effects.smoke.emit(e, Nh, 1 + Math.random(), 1.8 + Math.random() * 1.5, .45)
        }
        spawnBrakeShards(e) {
            if (!this.world) return;
            let t = this.car.root.position;
            for (let n = 0; n < 18; n++) {
                let r = .04 + Math.random() * .1,
                    i = .02 + Math.random() * .04,
                    a = .04 + Math.random() * .12,
                    o = new q(this.shardGeo, this.shardMats[n % this.shardMats.length]);
                o.scale.set(r * 2, i * 2, a * 2), o.castShadow = !0, this.scene.add(o);
                let s = n % 2 == 0 ? -1 : 1,
                    c = new Q({
                        mass: 1.5,
                        shape: new rf(new X(r, i, a)),
                        position: new X(t.x + s * .85, .45, t.z - 1.62),
                        velocity: new X(s * (2 + Math.random() * 6), 2 + Math.random() * 6, -e * (.6 + Math.random() * .4)),
                        angularVelocity: new X(Math.random() * 20, Math.random() * 20, Math.random() * 20)
                    });
                this.world.addBody(c), this.debris.push({
                    mesh: o,
                    body: c
                })
            }
        }
        detachWheel(e, t) {
            let n = this.car.wheels[e];
            if (!this.world || !n || this.wheels.some(e => e.wheel === n)) return;
            let r = n.holder,
                i = r.parent;
            if (!i) return;
            let a = r.position.clone(),
                o = r.quaternion.clone();
            r.updateWorldMatrix(!0, !1), r.getWorldPosition(Nh), r.getWorldQuaternion(Fh), this.scene.attach(r);
            let s = new Q({
                mass: 30,
                shape: new Lp(.4),
                position: new X(Nh.x, Math.max(.42, Nh.y), Nh.z),
                velocity: new X(t.x, t.y, t.z),
                angularVelocity: new X(-25, Math.random() * 6, Math.random() * 6),
                angularDamping: .05
            });
            s.quaternion.set(Fh.x, Fh.y, Fh.z, Fh.w), this.world.addBody(s), this.wheels.push({
                wheel: n,
                parent: i,
                position: a,
                quaternion: o,
                mesh: r,
                body: s
            })
        }
        update(e) {
            if (!this.active || !this.world || !this.carBody) return;
            this.time += e, this.world.step(1 / 120, e, 10);
            let t = this.carBody,
                n = this.car.root;
            n.quaternion.set(t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w), Nh.set(0, -.95, 0).applyQuaternion(n.quaternion), n.position.set(t.position.x + Nh.x, t.position.y + Nh.y, t.position.z + Nh.z);
            for (let e of this.wheels) e.mesh.position.set(e.body.position.x, e.body.position.y, e.body.position.z), e.mesh.quaternion.set(e.body.quaternion.x, e.body.quaternion.y, e.body.quaternion.z, e.body.quaternion.w);
            for (let e of this.debris) e.mesh.position.set(e.body.position.x, e.body.position.y, e.body.position.z), e.mesh.quaternion.set(e.body.quaternion.x, e.body.quaternion.y, e.body.quaternion.z, e.body.quaternion.w);
            for (let {
                    mesh: e,
                    body: t
                }
                of this.barrierBodies) e.position.set(t.position.x, t.position.y, t.position.z), e.quaternion.set(t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w);
            let r = t.velocity.length();
            t.position.y < 1.4 && r > 4 && Math.random() < .6 && (Nh.set(t.position.x + (Math.random() - .5) * 2, .1, t.position.z + (Math.random() - .5) * 4), Ph.set((Math.random() - .5) * 6, Math.random() * 3, t.velocity.z * .3), this.effects.sparks.emit(Nh, Ph, .06, .4 + Math.random() * .4), this.effects.smoke.emit(Nh, Ph.multiplyScalar(.2), 1.2, 2.2, .35))
        }
        get carSpeed() {
            return this.carBody ? this.carBody.velocity.length() : 0
        }
        reset() {
            for (let e of this.wheels) e.parent.add(e.mesh), e.mesh.position.copy(e.position), e.mesh.quaternion.copy(e.quaternion);
            this.wheels = [];
            for (let e of this.debris) this.scene.remove(e.mesh);
            this.debris = [];
            for (let [e, t] of this.barrierHome) e.position.copy(t.p), e.quaternion.copy(t.q);
            this.barrierBodies = [], this.world = null, this.carBody = null, this.active = !1
        }
    };

function Lh(e, t) {
    let n = document.createElement(`canvas`);
    n.width = e, n.height = t;
    let r = n.getContext(`2d`);
    if (!r) throw Error(`2D canvas unavailable`);
    return [n, r]
}

function Rh(e, t, n, r, i) {
    for (let a = 0; a < r; a++) {
        let r = Math.floor(Math.random() * 255);
        e.fillStyle = `rgba(${r},${r},${r},${i*Math.random()})`;
        let a = Math.random() * 2 + .5;
        e.fillRect(Math.random() * t, Math.random() * n, a, a)
    }
}

function zh(n) {
    let r = 1024,
        [i, a] = Lh(r, 880);
    a.fillStyle = `#2a2a2d`, a.fillRect(0, 0, r, 880), Rh(a, r, 880, 6e4, .22);
    let o = r / 14,
        s = e => r / 2 + e * o;
    a.fillStyle = `rgba(30,30,32,0.55)`;
    for (let e of [-3.6, 0, 3.6]) a.fillRect(s(e - .9), 0, .5 * o, 880), a.fillRect(s(e + .4), 0, .5 * o, 880);
    a.fillStyle = `#e9e6dc`;
    let c = .16 * o;
    a.fillRect(s(-5.4) - c / 2, 0, c, 880), a.fillRect(s(5.4) - c / 2, 0, c, 880), a.fillStyle = `#f2c94c`, a.fillRect(s(-6.6) - c / 2, 0, c, 880), a.fillRect(s(6.6) - c / 2, 0, c, 880), a.fillStyle = `#e9e6dc`;
    for (let e of [-1.8, 1.8]) a.fillRect(s(e) - c / 2, 0, c, 440);
    let l = new xi(i);
    return l.colorSpace = Re, l.wrapS = t, l.wrapT = e, l.anisotropy = n, l
}

function Bh(t) {
    let [n, r] = Lh(512, 512);
    r.fillStyle = `#3b3532`, r.fillRect(0, 0, 512, 512), Rh(r, 512, 512, 3e4, .25);
    let i = new xi(n);
    return i.colorSpace = Re, i.wrapS = e, i.wrapT = e, i.anisotropy = t, i
}

function Vh() {
    let [e, t] = Lh(256, 64);
    t.fillStyle = `#ffffff`, t.fillRect(0, 0, 256, 64), t.fillStyle = `#e8501b`;
    for (let e = -64; e < 320; e += 64) t.beginPath(), t.moveTo(e, 64), t.lineTo(e + 32, 64), t.lineTo(e + 64, 0), t.lineTo(e + 32, 0), t.closePath(), t.fill();
    let n = new xi(e);
    return n.colorSpace = Re, n
}

function Hh(e, t, n, r = 512, i = 256) {
    let [a, o] = Lh(r, i);
    o.fillStyle = t, o.fillRect(0, 0, r, i), o.strokeStyle = n, o.lineWidth = 10, o.strokeRect(14, 14, r - 28, i - 28), o.fillStyle = n, o.textAlign = `center`, o.textBaseline = `middle`, o.font = `bold ${Math.floor(i/(e.length+1.2))}px "PingFang SC", "Microsoft YaHei", sans-serif`, e.forEach((t, n) => {
        o.fillText(t, r / 2, i / (e.length + 1) * (n + 1))
    });
    let s = new xi(a);
    return s.colorSpace = Re, s
}

function Uh() {
    let [e, t] = Lh(64, 64), n = t.createRadialGradient(32, 32, 0, 32, 32, 32);
    return n.addColorStop(0, `rgba(255,255,255,1)`), n.addColorStop(.4, `rgba(255,255,255,0.5)`), n.addColorStop(1, `rgba(255,255,255,0)`), t.fillStyle = n, t.fillRect(0, 0, 64, 64), new xi(e)
}
var Wh = `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`,
    Gh = `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(uColor, tex.a * vAlpha);
    if (gl_FragColor.a < 0.01) discard;
  }
`,
    Kh = null,
    qh = class {
        opts;
        points;
        positions;
        velocities;
        sizes;
        alphas;
        life;
        maxLife;
        baseAlpha;
        cursor = 0;
        geometry;
        material;
        constructor(e) {
            this.opts = e;
            let t = e.capacity;
            this.positions = new Float32Array(t * 3), this.velocities = new Float32Array(t * 3), this.sizes = new Float32Array(t), this.alphas = new Float32Array(t), this.life = new Float32Array(t), this.maxLife = new Float32Array(t), this.baseAlpha = new Float32Array(t), this.geometry = new Dr, this.geometry.setAttribute(`position`, new pr(this.positions, 3)), this.geometry.setAttribute(`aSize`, new pr(this.sizes, 1)), this.geometry.setAttribute(`aAlpha`, new pr(this.alphas, 1)), Kh ??= Uh(), this.material = new so({
                uniforms: {
                    uMap: {
                        value: Kh
                    },
                    uColor: {
                        value: new G(e.color)
                    },
                    uScale: {
                        value: window.innerHeight * Math.min(window.devicePixelRatio, 2)
                    }
                },
                vertexShader: Wh,
                fragmentShader: Gh,
                transparent: !0,
                depthWrite: !1,
                blending: e.blending
            }), this.points = new vi(this.geometry, this.material), this.points.frustumCulled = !1
        }
        emit(e, t, n, r, i = 1) {
            let a = this.cursor;
            this.cursor = (this.cursor + 1) % this.opts.capacity, this.positions.set([e.x, e.y, e.z], a * 3), this.velocities.set([t.x, t.y, t.z], a * 3), this.sizes[a] = n, this.life[a] = r, this.maxLife[a] = r, this.baseAlpha[a] = i, this.alphas[a] = i
        }
        clear() {
            this.life.fill(0), this.alphas.fill(0), this.geometry.attributes.aAlpha.needsUpdate = !0
        }
        setViewportHeight(e) {
            this.material.uniforms.uScale.value = e
        }
        update(e) {
            let {
                gravity: t,
                drag: n,
                growth: r,
                bounce: i
            } = this.opts, a = Math.exp(-n * e);
            for (let n = 0; n < this.opts.capacity; n++) {
                if (this.life[n] <= 0) continue;
                this.life[n] -= e;
                let o = n * 3;
                this.velocities[o + 1] -= t * e, this.velocities[o] *= a, this.velocities[o + 1] *= a, this.velocities[o + 2] *= a, this.positions[o] += this.velocities[o] * e, this.positions[o + 1] += this.velocities[o + 1] * e, this.positions[o + 2] += this.velocities[o + 2] * e, this.positions[o + 1] < .02 && (this.positions[o + 1] = .02, this.velocities[o + 1] = Math.abs(this.velocities[o + 1]) * i), this.sizes[n] += r * e;
                let s = Math.max(0, this.life[n] / this.maxLife[n]);
                this.alphas[n] = this.baseAlpha[n] * s
            }
            this.geometry.attributes.position.needsUpdate = !0, this.geometry.attributes.aSize.needsUpdate = !0, this.geometry.attributes.aAlpha.needsUpdate = !0
        }
    };

function Jh(e) {
    let t = new qh({
            capacity: 700,
            color: 14209740,
            blending: 1,
            gravity: -.4,
            drag: 1.6,
            growth: 2.6,
            bounce: 0
        }),
        n = new qh({
            capacity: 900,
            color: 16752704,
            blending: 2,
            gravity: 9.8,
            drag: .6,
            growth: -.05,
            bounce: .35
        }),
        r = new qh({
            capacity: 700,
            color: 13625087,
            blending: 2,
            gravity: 9.8,
            drag: .3,
            growth: 0,
            bounce: .25
        });
    e.add(t.points, n.points, r.points);
    let i = [t, n, r];
    return {
        smoke: t,
        sparks: n,
        glass: r,
        update(e) {
            for (let t of i) t.update(e)
        },
        clear() {
            for (let e of i) e.clear()
        },
        resize(e) {
            for (let t of i) t.setViewportHeight(e)
        }
    }
}
var {
    car: Yh,
    brake: Xh
} = Pd, Zh = Yh.maxSpeedKmh / Nd, Qh = class {
    speed = 0;
    distance = 0;
    pedalForce = 0;
    accel = 0;
    powerCut = !1;
    holdTime = 0;
    reset() {
        this.speed = 0, this.distance = 0, this.pedalForce = 0, this.accel = 0, this.powerCut = !1, this.holdTime = 0
    }
    get speedKmh() {
        return this.speed * Nd
    }
    step(e, t) {
        let n;
        if (this.powerCut) t ? (this.holdTime += e, this.pedalForce += (Xh.rampBase + 2 * Xh.rampGrowth * this.holdTime) * e) : (this.holdTime = 0, this.pedalForce = Math.max(0, this.pedalForce - Xh.releaseRate * e)), n = -(Xh.rollingDecel + Xh.dragCoeff * this.speed * this.speed + Xh.decelPerNewton * this.pedalForce);
        else {
            let e = Math.min(this.speed / Zh, 1);
            n = Yh.launchAccel * (1 - e ** +Yh.accelFalloffExp)
        }
        return this.accel = n, this.speed = Math.max(0, this.speed + n * e), this.distance += this.speed * e, this.powerCut && this.pedalForce >= Xh.breakForceN
    }
}, $h = 3, eg = 2.7, tg = .04, ng = class {
    phase = `menu`;
    dynamics = new Qh;
    brakeElapsed = 0;
    v0Kmh = 0;
    peakForce = 0;
    countdown = 0;
    lastCountdownTick = 0;
    brakeStartDistance = 0;
    earlyHintCooldown = 0;
    samples = [];
    sampleTimer = 0;
    start() {
        return this.dynamics.reset(), this.brakeElapsed = 0, this.v0Kmh = 0, this.peakForce = 0, this.samples = [], this.sampleTimer = 0, this.countdown = $h, this.lastCountdownTick = 4, this.phase = `countdown`, []
    }
    toMenu() {
        this.dynamics.reset(), this.phase = `menu`
    }
    get canBrake() {
        return this.phase === `accelerating` && this.dynamics.speedKmh >= Pd.brake.minSpeedKmh
    }
    get distanceToBarrier() {
        return Pd.track.barrierDistance - eg - this.dynamics.distance
    }
    step(e, t) {
        let n = [];
        switch (this.earlyHintCooldown = Math.max(0, this.earlyHintCooldown - e), this.phase) {
            case `countdown`: {
                this.countdown -= e;
                let t = Math.ceil(this.countdown);
                t < this.lastCountdownTick && t > 0 && (this.lastCountdownTick = t, n.push({
                    type: `countdown`,
                    value: t
                })), this.countdown <= 0 && (this.phase = `accelerating`, n.push({
                    type: `start`
                }));
                break
            }
            case `accelerating`:
                if (t && (this.canBrake ? (this.phase = `braking`, this.dynamics.powerCut = !0, this.v0Kmh = this.dynamics.speedKmh, this.brakeStartDistance = this.dynamics.distance, this.recordSample(), n.push({
                        type: `brake_start`,
                        v0Kmh: this.v0Kmh
                    })) : this.earlyHintCooldown === 0 && (this.earlyHintCooldown = 1.2, n.push({
                        type: `brake_too_early`
                    }))), this.phase === `accelerating`) {
                    this.dynamics.step(e, !1), this.checkBarrier(n);
                    break
                }
                this.stepBraking(e, t, n);
                break;
            case `braking`:
                this.stepBraking(e, t, n)
        }
        return n
    }
    stepBraking(e, t, n) {
        let r = this.dynamics.step(e, t);
        if (this.brakeElapsed += e, this.peakForce = Math.max(this.peakForce, this.dynamics.pedalForce), this.sampleTimer += e, this.sampleTimer >= tg && (this.sampleTimer -= tg, this.recordSample()), r) this.dynamics.pedalForce = Pd.brake.breakForceN, this.peakForce = Pd.brake.breakForceN, this.crash(`brake_snap`, n);
        else if (!this.checkBarrier(n) && this.dynamics.speed <= Pd.brake.stopSpeed) {
            this.dynamics.speed = 0, this.phase = `stopped`;
            let e = this.result(!0);
            n.push({
                type: `stopped`,
                result: e
            })
        }
    }
    recordSample() {
        this.samples.push({
            t: this.brakeElapsed,
            speedKmh: this.dynamics.speedKmh,
            force: Math.min(this.dynamics.pedalForce, Pd.brake.breakForceN)
        })
    }
    checkBarrier(e) {
        return this.distanceToBarrier > 0 ? !1 : (this.crash(`barrier`, e), !0)
    }
    crash(e, t) {
        this.phase = `crashed`, t.push({
            type: `crash`,
            reason: e,
            result: this.result(!1, e)
        })
    }
    result(e, t) {
        this.v0Kmh > 0 && this.recordSample();
        let n = Math.round(this.brakeElapsed * 1e3) / 1e3,
            r = Math.round(this.v0Kmh * 10) / 10;
        return {
            success: e,
            reason: t,
            v0Kmh: r,
            stopSeconds: n,
            stopDistance: this.dynamics.distance - this.brakeStartDistance,
            peakForce: this.peakForce,
            score: e ? Fd(r, n) : 0,
            samples: this.samples.slice()
        }
    }
}, rg = new U, ig = new U, ag = class {
    camera;
    mode = `showcase`;
    orbit = 3.75;
    shake = 0;
    time = 0;
    offset = new U(6, 1.6, 6);
    lookOffset = new U(0, .85, 0);
    anchor = new U;
    anchorReady = !1;
    constructor(e) {
        this.camera = new Ko(42, e, .1, 12e3), this.camera.position.copy(this.offset)
    }
    setMode(e) {
        e === `finish` && (this.orbit = .9), this.mode = e
    }
    addShake(e) {
        this.shake = Math.max(this.shake, e)
    }
    update(e, t, n) {
        let r = this.camera,
            i = r.aspect < 1;
        this.time += e;
        let a = i ? 58 : 42,
            o = 4;
        switch (this.mode) {
            case `showcase`: {
                this.orbit += e * .16;
                let t = i ? 9.5 : 7.8;
                rg.set(Math.sin(this.orbit) * t, i ? 2.4 : 1.5, Math.cos(this.orbit) * t), ig.set(0, i ? -1.6 : .85, 0), o = 2;
                break
            }
            case `chase`: {
                let e = Math.min(n / 72, 1);
                rg.set(1.6 - e * 1.2, 2.2 - e * .5, 8.2 - e * 1.4), ig.set(0, 1, -6), a += e * 22, o = 2.5;
                break
            }
            case `brake`: {
                let e = Math.min(n / 72, 1);
                rg.set(2, 1.55, 7.6 - e), ig.set(.3, .9, -4), a += e * 14, o = 1.8;
                break
            }
            case `crash`:
                rg.set(9, 4.5, 13), ig.set(0, 0, 0), a += 6, o = 2.2;
                break;
            case `finish`: {
                this.orbit += e * .25;
                let t = i ? 8.5 : 6.8;
                rg.set(Math.sin(this.orbit) * t, 1.4, Math.cos(this.orbit) * t), ig.set(0, .8, 0), o = 1.6;
                break
            }
        }!this.anchorReady || this.mode !== `crash` ? (this.anchor.copy(t), this.anchorReady = !0) : this.anchor.lerp(t, 1 - Math.exp(-e * 5));
        let s = 1 - Math.exp(-e * o);
        if (this.offset.lerp(rg, s), this.lookOffset.lerp(ig, Math.min(1, s * 1.5)), r.position.copy(this.anchor).add(this.offset), this.shake = Math.max(0, this.shake - e * 1.4), this.shake > 0) {
            let e = this.time,
                t = this.shake;
            r.position.x += t * (Math.sin(e * 23.3) * .6 + Math.sin(e * 41.7 + 1.3) * .4) * .5, r.position.y += t * (Math.sin(e * 29.1 + .7) * .6 + Math.sin(e * 47.9 + 2.1) * .4) * .5
        }
        r.lookAt(this.anchor.x + this.lookOffset.x, this.anchor.y + this.lookOffset.y, this.anchor.z + this.lookOffset.z);
        let c = r.fov + (a - r.fov) * Math.min(1, e * 2);
        Math.abs(c - r.fov) > .001 && (r.fov = c, r.updateProjectionMatrix())
    }
    resize(e) {
        this.camera.aspect = e, this.camera.updateProjectionMatrix()
    }
}, og = `
  varying vec3 vDir;
  void main() {
    vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = pos.xyww;
  }
`, sg = `
  uniform vec3 uSunDir;
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunColor;
  uniform float uCloudAmount;
  varying vec3 vDir;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;
    vec3 col;
    if (h > 0.0) {
      float t1 = smoothstep(0.0, 0.18, h);
      float t2 = smoothstep(0.12, 0.65, h);
      col = mix(uHorizon, uMid, t1);
      col = mix(col, uZenith, t2);
    } else {
      col = mix(uHorizon, uGround, smoothstep(0.0, 0.08, -h));
    }

    float sd = max(dot(dir, normalize(uSunDir)), 0.0);
    float glow = pow(sd, 6.0) * 0.55 + pow(sd, 48.0) * 0.9;
    col += uSunColor * glow * smoothstep(-0.05, 0.05, h + 0.02);
    col += uSunColor * smoothstep(0.9993, 0.9997, sd) * 2.2;

    if (h > 0.0) {
      vec2 uv = dir.xz / (h + 0.12);
      uv *= vec2(0.6, 1.6);
      float c = fbm(uv * 1.3 + vec2(3.1, 0.7));
      c = smoothstep(0.52, 0.85, c) * uCloudAmount * smoothstep(0.02, 0.14, h) * (1.0 - smoothstep(0.35, 0.8, h));
      vec3 cloudLit = mix(vec3(0.42, 0.24, 0.30), uSunColor * 1.15, pow(sd, 3.0) * 0.8 + 0.2);
      col = mix(col, cloudLit, c * 0.85);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function cg(e, t) {
    let n = new so({
            uniforms: {
                uSunDir: {
                    value: e.clone()
                },
                uZenith: {
                    value: new G(1909056)
                },
                uMid: {
                    value: new G(8014435)
                },
                uHorizon: {
                    value: new G(15765600).multiplyScalar(1.15)
                },
                uGround: {
                    value: new G(2759970)
                },
                uSunColor: {
                    value: new G(16752725)
                },
                uCloudAmount: {
                    value: 1
                }
            },
            vertexShader: og,
            fragmentShader: sg,
            side: 1,
            depthWrite: !1,
            fog: !1
        }),
        r = new q(new Xa(t, 48, 24), n);
    return r.frustumCulled = !1, r.renderOrder = -10, r
}
var lg = 260,
    ug = -(Pd.track.barrierDistance + 700),
    dg = lg - ug,
    fg = (lg + ug) / 2;

function pg(e, t, n) {
    let r = t.capabilities.getMaxAnisotropy(),
        i = new U;
    i.setFromSphericalCoords(1, Et.degToRad(87.5), Et.degToRad(215));
    let a = cg(i, 5e3);
    e.add(a), e.environment = mg(t, i), e.fog = new Nn(11564902, 38e-5);
    let o = new Po(16765616, 2761776, .55);
    e.add(o);
    let s = new Yo(16757370, 3.2);
    s.castShadow = !0, s.shadow.mapSize.set(n, n);
    let c = s.shadow.camera;
    c.left = -14, c.right = 14, c.top = 14, c.bottom = -14, c.near = 1, c.far = 120, s.shadow.bias = -4e-4, s.shadow.normalBias = .03, e.add(s), e.add(s.target);
    let l = new U().crossVectors(new U(0, 1, 0), i).normalize(),
        u = new U().crossVectors(i, l).normalize(),
        d = new U;
    hg(e, r), gg(e, r), _g(e);
    let f = vg(e);
    yg(e);
    let p = bg(e),
        m = Sg();
    e.add(m);
    let h = xg(e);
    return {
        sun: s,
        sunDirection: i,
        barrierBlocks: p,
        update(e, t) {
            a.position.copy(e), m.position.set(0, 0, e.z * .92);
            let r = (c.right - c.left) / n,
                o = Math.round(e.dot(l) / r) * r,
                p = Math.round(e.dot(u) / r) * r,
                g = e.dot(i);
            d.copy(l).multiplyScalar(o).addScaledVector(u, p).addScaledVector(i, g), s.position.copy(d).addScaledVector(i, 60), s.target.position.copy(d);
            let _ = Math.sin(t * 9) > 0 ? 6 : .2;
            for (let e of h) e.emissiveIntensity = _;
            f.emissiveIntensity = 3.2
        }
    }
}

function mg(e, t) {
    let n = new Pn;
    n.add(cg(t, 900));
    let r = new zr({
        color: 11578020,
        side: 2
    });
    for (let [e, t, i, a, o] of [
            [0, 60, 0, 120, 14],
            [-70, 30, -20, 50, 8],
            [70, 30, 20, 50, 8]
        ]) {
        let s = new q(new Ka(a, o), r);
        s.position.set(e, t, i), s.lookAt(0, 0, 0), n.add(s)
    }
    let i = new q(new Ka(2e3, 2e3), new zr({
        color: 1709335
    }));
    i.rotation.x = -Math.PI / 2, i.position.y = -2, n.add(i);
    let a = new zs(e),
        o = a.fromScene(n, .02);
    return a.dispose(), o.texture
}

function hg(e, t) {
    let n = Bh(t);
    n.repeat.set(600, 1200);
    let r = new q(new Ka(3e3, 6e3), new lo({
        map: n,
        roughness: .62,
        metalness: .05,
        color: 9075314
    }));
    r.rotation.x = -Math.PI / 2, r.position.set(0, -.02, fg), r.receiveShadow = !0, e.add(r)
}

function gg(e, t) {
    let n = zh(t);
    n.repeat.set(1, dg / 12);
    let r = new lo({
            map: n,
            roughness: .38,
            metalness: .08,
            envMapIntensity: .9
        }),
        i = new q(new Ka(Pd.track.roadWidth, dg), r);
    i.rotation.x = -Math.PI / 2, i.position.set(0, 0, fg), i.receiveShadow = !0, e.add(i);
    let a = new lo({
        color: 10130572,
        roughness: .8
    });
    for (let t of [-1, 1]) {
        let n = new q(new Ti(.4, .14, dg), a);
        n.position.set(t * (Pd.track.roadWidth / 2 + .2), .07, fg), n.receiveShadow = !0, e.add(n)
    }
}

function _g(e) {
    let t = new lo({
            color: 12106946,
            metalness: .6,
            roughness: .55
        }),
        n = new lo({
            color: 9146518,
            metalness: .7,
            roughness: .45
        }),
        r = Pd.track.roadWidth / 2 + 1.1,
        i = Math.floor(dg / 4),
        a = new ci(new Ti(.12, .8, .12), n, i * 2),
        o = new Xt,
        s = 0;
    for (let n of [-1, 1]) {
        let c = new q(new Ti(.06, .32, dg), t);
        c.position.set(n * r, .66, fg), c.castShadow = !0, e.add(c);
        for (let e = 0; e < i; e++) o.makeTranslation(n * (r + .1), .4, lg - e * 4), a.setMatrixAt(s++, o)
    }
    a.castShadow = !0, e.add(a)
}

function vg(e) {
    let t = Math.floor(dg / 45),
        n = Pd.track.roadWidth / 2 + 2.2,
        r = new lo({
            color: 3816770,
            metalness: .8,
            roughness: .4
        }),
        i = new lo({
            color: 2236962,
            emissive: 16762250,
            emissiveIntensity: 3.2
        }),
        a = new ci(new Di(.09, .14, 9, 8), r, t * 2),
        o = new ci(new Ti(2.4, .1, .1), r, t * 2),
        s = new ci(new Ti(.9, .12, .35), i, t * 2),
        c = new Xt,
        l = 0;
    for (let e of [-1, 1])
        for (let r = 0; r < t; r++) {
            let t = lg - r * 45 - (e > 0 ? 45 / 2 : 0);
            c.makeTranslation(e * n, 4.5, t), a.setMatrixAt(l, c), c.makeTranslation(e * (n - 1.15), 8.95, t), o.setMatrixAt(l, c), c.makeTranslation(e * (n - 2.1), 8.85, t), s.setMatrixAt(l, c), l++
        }
    return a.castShadow = !0, e.add(a, o, s), i
}

function yg(e) {
    let t = new lo({
            color: 8159366,
            metalness: .8,
            roughness: .4
        }),
        n = (n, r, i, a, o) => {
            let s = Hh(r, i, a),
                c = new q(new Ka(4, 2), new lo({
                    map: s,
                    roughness: .5,
                    emissive: 16777215,
                    emissiveMap: s,
                    emissiveIntensity: .25
                })),
                l = o * (Pd.track.roadWidth / 2 + 3.2);
            c.position.set(l, 4.2, n), e.add(c);
            let u = new q(new Di(.08, .08, 4.2, 8), t);
            u.position.set(l, 2.1, n - .05), u.castShadow = !0, e.add(u)
        },
        r = -Pd.track.barrierDistance;
    for (let e of [1500, 1e3, 500]) n(r + e, [`前方施工`, `${e} m`], `#0f6b3a`, `#ffffff`, 1);
    for (let e of [300, 200, 100]) n(r + e, [`道路封闭`, `${e} m`], `#f2b21b`, `#1a1a1a`, 1);
    n(-80, [`极限刹车挑战`, `100 km/h 后可刹车`], `#14325c`, `#ffffff`, -1)
}

function bg(e) {
    let t = -Pd.track.barrierDistance,
        n = new lo({
            map: Vh(),
            roughness: .5
        }),
        r = new lo({
            color: 12169896,
            roughness: .9
        }),
        i = [];
    for (let a = -6; a <= 6; a += 2) {
        let o = new q(new Ti(1.9, 1, .7), [r, r, r, r, n, n]);
        o.position.set(a, .5, t), o.castShadow = !0, o.receiveShadow = !0, e.add(o), i.push(o)
    }
    let a = new q(new Ka(9, 2.2), new lo({
        map: Hh([`道路封闭  ROAD CLOSED`], `#d8351b`, `#ffffff`, 1024, 256),
        roughness: .5
    }));
    a.position.set(0, 3.4, t - 3), e.add(a);
    let o = new lo({
        color: 5593696,
        metalness: .7,
        roughness: .4
    });
    for (let n of [-4.2, 4.2]) {
        let r = new q(new Di(.1, .1, 4.5, 8), o);
        r.position.set(n, 2.25, t - 3.05), e.add(r)
    }
    return i
}

function xg(e) {
    let t = -Pd.track.barrierDistance,
        n = [];
    for (let r = -6; r <= 6; r += 4) {
        let i = new lo({
                color: 6702080,
                emissive: 16752906,
                emissiveIntensity: 4
            }),
            a = new q(new Xa(.16, 16, 12), i);
        a.position.set(r, 1.18, t), e.add(a), n.push(i)
    }
    return n
}

function Sg() {
    let e = new Tn;
    for (let [t, n, r] of [
            [2600, 260, 3813444],
            [2200, 170, 4864582]
        ]) {
        let i = [],
            a = [],
            o = t,
            s = () => (o = (o * 9301 + 49297) % 233280, o / 233280),
            c = [];
        for (let e = 0; e <= 220; e++) {
            let r = e / 220,
                i = n * (.35 + .35 * Math.abs(Math.sin(r * Math.PI * 7 + t)) + .2 * Math.abs(Math.sin(r * Math.PI * 23)) + .15 * s());
            c.push(i)
        }
        for (let e = 0; e <= 220; e++) {
            let n = e / 220 * Math.PI * 2,
                r = Math.cos(n) * t,
                o = Math.sin(n) * t;
            if (i.push(r, -10, o, r, c[e], o), e < 220) {
                let t = e * 2;
                a.push(t, t + 1, t + 2, t + 1, t + 3, t + 2)
            }
        }
        let l = new Dr;
        l.setAttribute(`position`, new K(i, 3)), l.setIndex(a), l.computeVertexNormals();
        let u = new q(l, new zr({
            color: r,
            side: 2,
            fog: !0
        }));
        e.add(u)
    }
    return e
}
var Cg = {
        name: `CopyShader`,
        uniforms: {
            tDiffuse: {
                value: null
            },
            opacity: {
                value: 1
            }
        },
        vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
        fragmentShader: `

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`
    },
    wg = class {
        constructor() {
            this.isPass = !0, this.enabled = !0, this.needsSwap = !0, this.clear = !1, this.renderToScreen = !1
        }
        setSize() {}
        render() {
            console.error(`THREE.Pass: .render() must be implemented in derived pass.`)
        }
        dispose() {}
    },
    Tg = new qo(-1, 1, 1, -1, 0, 1),
    Eg = new class extends Dr {
        constructor() {
            super(), this.setAttribute(`position`, new K([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)), this.setAttribute(`uv`, new K([0, 2, 0, 0, 2, 0], 2))
        }
    },
    Dg = class {
        constructor(e) {
            this._mesh = new q(Eg, e)
        }
        dispose() {
            this._mesh.geometry.dispose()
        }
        render(e) {
            e.render(this._mesh, Tg)
        }
        get material() {
            return this._mesh.material
        }
        set material(e) {
            this._mesh.material = e
        }
    },
    Og = class extends wg {
        constructor(e, t = `tDiffuse`) {
            super(), this.textureID = t, this.uniforms = null, this.material = null, e instanceof so ? (this.uniforms = e.uniforms, this.material = e) : e && (this.uniforms = io.clone(e.uniforms), this.material = new so({
                name: e.name === void 0 ? `unspecified` : e.name,
                defines: Object.assign({}, e.defines),
                uniforms: this.uniforms,
                vertexShader: e.vertexShader,
                fragmentShader: e.fragmentShader
            })), this._fsQuad = new Dg(this.material)
        }
        render(e, t, n) {
            this.uniforms[this.textureID] && (this.uniforms[this.textureID].value = n.texture), this._fsQuad.material = this.material, this.renderToScreen ? (e.setRenderTarget(null), this._fsQuad.render(e)) : (e.setRenderTarget(t), this.clear && e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil), this._fsQuad.render(e))
        }
        dispose() {
            this.material.dispose(), this._fsQuad.dispose()
        }
    },
    kg = class extends wg {
        constructor(e, t) {
            super(), this.scene = e, this.camera = t, this.clear = !0, this.needsSwap = !1, this.inverse = !1
        }
        render(e, t, n) {
            let r = e.getContext(),
                i = e.state;
            i.buffers.color.setMask(!1), i.buffers.depth.setMask(!1), i.buffers.color.setLocked(!0), i.buffers.depth.setLocked(!0);
            let a, o;
            this.inverse ? (a = 0, o = 1) : (a = 1, o = 0), i.buffers.stencil.setTest(!0), i.buffers.stencil.setOp(r.REPLACE, r.REPLACE, r.REPLACE), i.buffers.stencil.setFunc(r.ALWAYS, a, 4294967295), i.buffers.stencil.setClear(o), i.buffers.stencil.setLocked(!0), e.setRenderTarget(n), this.clear && e.clear(), e.render(this.scene, this.camera), e.setRenderTarget(t), this.clear && e.clear(), e.render(this.scene, this.camera), i.buffers.color.setLocked(!1), i.buffers.depth.setLocked(!1), i.buffers.color.setMask(!0), i.buffers.depth.setMask(!0), i.buffers.stencil.setLocked(!1), i.buffers.stencil.setFunc(r.EQUAL, 1, 4294967295), i.buffers.stencil.setOp(r.KEEP, r.KEEP, r.KEEP), i.buffers.stencil.setLocked(!0)
        }
    },
    Ag = class extends wg {
        constructor() {
            super(), this.needsSwap = !1
        }
        render(e) {
            e.state.buffers.stencil.setLocked(!1), e.state.buffers.stencil.setTest(!1)
        }
    },
    jg = class {
        constructor(e, t) {
            if (this.renderer = e, this._pixelRatio = e.getPixelRatio(), t === void 0) {
                let n = e.getSize(new H);
                this._width = n.width, this._height = n.height, t = new qt(this._width * this._pixelRatio, this._height * this._pixelRatio, {
                    type: g
                }), t.texture.name = `EffectComposer.rt1`
            } else this._width = t.width, this._height = t.height;
            this.renderTarget1 = t, this.renderTarget2 = t.clone(), this.renderTarget2.texture.name = `EffectComposer.rt2`, this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2, this.renderToScreen = !0, this.passes = [], this.copyPass = new Og(Cg), this.copyPass.material.blending = 0, this.timer = new es
        }
        swapBuffers() {
            let e = this.readBuffer;
            this.readBuffer = this.writeBuffer, this.writeBuffer = e
        }
        addPass(e) {
            this.passes.push(e), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio)
        }
        insertPass(e, t) {
            this.passes.splice(t, 0, e), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio)
        }
        removePass(e) {
            let t = this.passes.indexOf(e);
            t !== -1 && this.passes.splice(t, 1)
        }
        isLastEnabledPass(e) {
            for (let t = e + 1; t < this.passes.length; t++)
                if (this.passes[t].enabled) return !1;
            return !0
        }
        render(e) {
            this.timer.update(), e === void 0 && (e = this.timer.getDelta());
            let t = this.renderer.getRenderTarget(),
                n = !1;
            for (let t = 0, r = this.passes.length; t < r; t++) {
                let r = this.passes[t];
                if (r.enabled !== !1) {
                    if (r.renderToScreen = this.renderToScreen && this.isLastEnabledPass(t), r.render(this.renderer, this.writeBuffer, this.readBuffer, e, n), r.needsSwap) {
                        if (n) {
                            let t = this.renderer.getContext(),
                                n = this.renderer.state.buffers.stencil;
                            n.setFunc(t.NOTEQUAL, 1, 4294967295), this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, e), n.setFunc(t.EQUAL, 1, 4294967295)
                        }
                        this.swapBuffers()
                    }
                    kg !== void 0 && (r instanceof kg ? n = !0 : r instanceof Ag && (n = !1))
                }
            }
            this.renderer.setRenderTarget(t)
        }
        reset(e) {
            if (e === void 0) {
                let t = this.renderer.getSize(new H);
                this._pixelRatio = this.renderer.getPixelRatio(), this._width = t.width, this._height = t.height, e = this.renderTarget1.clone(), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio)
            }
            this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.renderTarget1 = e, this.renderTarget2 = e.clone(), this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2
        }
        setSize(e, t) {
            this._width = e, this._height = t;
            let n = this._width * this._pixelRatio,
                r = this._height * this._pixelRatio;
            this.renderTarget1.setSize(n, r), this.renderTarget2.setSize(n, r);
            for (let e = 0; e < this.passes.length; e++) this.passes[e].setSize(n, r)
        }
        setPixelRatio(e) {
            this._pixelRatio = e, this.setSize(this._width, this._height)
        }
        dispose() {
            this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.copyPass.dispose()
        }
    },
    Mg = class extends wg {
        constructor(e, t, n = null, r = null, i = null) {
            super(), this.scene = e, this.camera = t, this.overrideMaterial = n, this.clearColor = r, this.clearAlpha = i, this.clear = !0, this.clearDepth = !1, this.needsSwap = !1, this.isRenderPass = !0, this._oldClearColor = new G
        }
        render(e, t, n) {
            let r = e.autoClear;
            e.autoClear = !1;
            let i, a;
            this.overrideMaterial !== null && (a = this.scene.overrideMaterial, this.scene.overrideMaterial = this.overrideMaterial), this.clearColor !== null && (e.getClearColor(this._oldClearColor), e.setClearColor(this.clearColor, e.getClearAlpha())), this.clearAlpha !== null && (i = e.getClearAlpha(), e.setClearAlpha(this.clearAlpha)), this.clearDepth == 1 && e.clearDepth(), e.setRenderTarget(this.renderToScreen ? null : n), this.clear === !0 && e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil), e.render(this.scene, this.camera), this.clearColor !== null && e.setClearColor(this._oldClearColor), this.clearAlpha !== null && e.setClearAlpha(i), this.overrideMaterial !== null && (this.scene.overrideMaterial = a), e.autoClear = r
        }
    },
    Ng = {
        name: `LuminosityHighPassShader`,
        uniforms: {
            tDiffuse: {
                value: null
            },
            luminosityThreshold: {
                value: 1
            },
            smoothWidth: {
                value: 1
            },
            defaultColor: {
                value: new G(0)
            },
            defaultOpacity: {
                value: 0
            }
        },
        vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
        fragmentShader: `

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`
    },
    Pg = class e extends wg {
        constructor(e, t = 1, n, r) {
            super(), this.strength = t, this.radius = n, this.threshold = r, this.resolution = e === void 0 ? new H(256, 256) : new H(e.x, e.y), this.clearColor = new G(0, 0, 0), this.needsSwap = !1, this.renderTargetsHorizontal = [], this.renderTargetsVertical = [], this.nMips = 5;
            let i = Math.round(this.resolution.x / 2),
                a = Math.round(this.resolution.y / 2);
            this.renderTargetBright = new qt(i, a, {
                type: g,
                depthBuffer: !1
            }), this.renderTargetBright.texture.name = `UnrealBloomPass.bright`, this.renderTargetBright.texture.generateMipmaps = !1;
            for (let e = 0; e < this.nMips; e++) {
                let t = new qt(i, a, {
                    type: g,
                    depthBuffer: !1
                });
                t.texture.name = `UnrealBloomPass.h` + e, t.texture.generateMipmaps = !1, this.renderTargetsHorizontal.push(t);
                let n = new qt(i, a, {
                    type: g,
                    depthBuffer: !1
                });
                n.texture.name = `UnrealBloomPass.v` + e, n.texture.generateMipmaps = !1, this.renderTargetsVertical.push(n), i = Math.round(i / 2), a = Math.round(a / 2)
            }
            let o = Ng;
            this.highPassUniforms = io.clone(o.uniforms), this.highPassUniforms.luminosityThreshold.value = r, this.highPassUniforms.smoothWidth.value = .01, this.materialHighPassFilter = new so({
                uniforms: this.highPassUniforms,
                vertexShader: o.vertexShader,
                fragmentShader: o.fragmentShader
            }), this.separableBlurMaterials = [];
            let s = [6, 10, 14, 18, 22];
            i = Math.round(this.resolution.x / 2), a = Math.round(this.resolution.y / 2);
            for (let e = 0; e < this.nMips; e++) this.separableBlurMaterials.push(this._getSeparableBlurMaterial(s[e])), this.separableBlurMaterials[e].uniforms.invSize.value = new H(1 / i, 1 / a), i = Math.round(i / 2), a = Math.round(a / 2);
            this.compositeMaterial = this._getCompositeMaterial(this.nMips), this.compositeMaterial.uniforms.blurTexture1.value = this.renderTargetsVertical[0].texture, this.compositeMaterial.uniforms.blurTexture2.value = this.renderTargetsVertical[1].texture, this.compositeMaterial.uniforms.blurTexture3.value = this.renderTargetsVertical[2].texture, this.compositeMaterial.uniforms.blurTexture4.value = this.renderTargetsVertical[3].texture, this.compositeMaterial.uniforms.blurTexture5.value = this.renderTargetsVertical[4].texture, this.compositeMaterial.uniforms.bloomStrength.value = t, this.compositeMaterial.uniforms.bloomRadius.value = .1;
            let c = [1, .8, .6, .4, .2];
            this.compositeMaterial.uniforms.bloomFactors.value = c, this.bloomTintColors = [new U(1, 1, 1), new U(1, 1, 1), new U(1, 1, 1), new U(1, 1, 1), new U(1, 1, 1)], this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors, this.copyUniforms = io.clone(Cg.uniforms), this.blendMaterial = new so({
                uniforms: this.copyUniforms,
                vertexShader: Cg.vertexShader,
                fragmentShader: Cg.fragmentShader,
                premultipliedAlpha: !0,
                blending: 2,
                depthTest: !1,
                depthWrite: !1,
                transparent: !0
            }), this._oldClearColor = new G, this._oldClearAlpha = 1, this._basic = new zr, this._fsQuad = new Dg(null)
        }
        dispose() {
            for (let e = 0; e < this.renderTargetsHorizontal.length; e++) this.renderTargetsHorizontal[e].dispose();
            for (let e = 0; e < this.renderTargetsVertical.length; e++) this.renderTargetsVertical[e].dispose();
            this.renderTargetBright.dispose();
            for (let e = 0; e < this.separableBlurMaterials.length; e++) this.separableBlurMaterials[e].dispose();
            this.compositeMaterial.dispose(), this.blendMaterial.dispose(), this._basic.dispose(), this._fsQuad.dispose()
        }
        setSize(e, t) {
            let n = Math.round(e / 2),
                r = Math.round(t / 2);
            this.renderTargetBright.setSize(n, r);
            for (let e = 0; e < this.nMips; e++) this.renderTargetsHorizontal[e].setSize(n, r), this.renderTargetsVertical[e].setSize(n, r), this.separableBlurMaterials[e].uniforms.invSize.value = new H(1 / n, 1 / r), n = Math.round(n / 2), r = Math.round(r / 2)
        }
        render(t, n, r, i, a) {
            t.getClearColor(this._oldClearColor), this._oldClearAlpha = t.getClearAlpha();
            let o = t.autoClear;
            t.autoClear = !1, t.setClearColor(this.clearColor, 0), a && t.state.buffers.stencil.setTest(!1), this.renderToScreen && (this._fsQuad.material = this._basic, this._basic.map = r.texture, t.setRenderTarget(null), t.clear(), this._fsQuad.render(t)), this.highPassUniforms.tDiffuse.value = r.texture, this.highPassUniforms.luminosityThreshold.value = this.threshold, this._fsQuad.material = this.materialHighPassFilter, t.setRenderTarget(this.renderTargetBright), t.clear(), this._fsQuad.render(t);
            let s = this.renderTargetBright;
            for (let n = 0; n < this.nMips; n++) this._fsQuad.material = this.separableBlurMaterials[n], this.separableBlurMaterials[n].uniforms.colorTexture.value = s.texture, this.separableBlurMaterials[n].uniforms.direction.value = e.BlurDirectionX, t.setRenderTarget(this.renderTargetsHorizontal[n]), t.clear(), this._fsQuad.render(t), this.separableBlurMaterials[n].uniforms.colorTexture.value = this.renderTargetsHorizontal[n].texture, this.separableBlurMaterials[n].uniforms.direction.value = e.BlurDirectionY, t.setRenderTarget(this.renderTargetsVertical[n]), t.clear(), this._fsQuad.render(t), s = this.renderTargetsVertical[n];
            this._fsQuad.material = this.compositeMaterial, this.compositeMaterial.uniforms.bloomStrength.value = this.strength, this.compositeMaterial.uniforms.bloomRadius.value = this.radius, this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors, t.setRenderTarget(this.renderTargetsHorizontal[0]), t.clear(), this._fsQuad.render(t), this._fsQuad.material = this.blendMaterial, this.copyUniforms.tDiffuse.value = this.renderTargetsHorizontal[0].texture, a && t.state.buffers.stencil.setTest(!0), this.renderToScreen ? (t.setRenderTarget(null), this._fsQuad.render(t)) : (t.setRenderTarget(r), this._fsQuad.render(t)), t.setClearColor(this._oldClearColor, this._oldClearAlpha), t.autoClear = o
        }
        _getSeparableBlurMaterial(e) {
            let t = [],
                n = e / 3;
            for (let r = 0; r < e; r++) t.push(.39894 * Math.exp(-.5 * r * r / (n * n)) / n);
            let r = [],
                i = [];
            for (let n = 1; n < e; n += 2) {
                let a = t[n],
                    o = n + 1 < e ? t[n + 1] : 0,
                    s = a + o;
                r.push((n * a + (n + 1) * o) / s), i.push(s)
            }
            return new so({
                defines: {
                    KERNEL_PAIRS: r.length
                },
                uniforms: {
                    colorTexture: {
                        value: null
                    },
                    invSize: {
                        value: new H(.5, .5)
                    },
                    direction: {
                        value: new H(.5, .5)
                    },
                    centerWeight: {
                        value: t[0]
                    },
                    gaussianOffsets: {
                        value: r
                    },
                    gaussianWeights: {
                        value: i
                    }
                },
                vertexShader: `

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,
                fragmentShader: `

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`
            })
        }
        _getCompositeMaterial(e) {
            return new so({
                defines: {
                    NUM_MIPS: e
                },
                uniforms: {
                    blurTexture1: {
                        value: null
                    },
                    blurTexture2: {
                        value: null
                    },
                    blurTexture3: {
                        value: null
                    },
                    blurTexture4: {
                        value: null
                    },
                    blurTexture5: {
                        value: null
                    },
                    bloomStrength: {
                        value: 1
                    },
                    bloomFactors: {
                        value: null
                    },
                    bloomTintColors: {
                        value: null
                    },
                    bloomRadius: {
                        value: 0
                    }
                },
                vertexShader: `

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,
                fragmentShader: `

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`
            })
        }
    };
Pg.BlurDirectionX = new H(1, 0), Pg.BlurDirectionY = new H(0, 1);
var Fg = {
        name: `OutputShader`,
        uniforms: {
            tDiffuse: {
                value: null
            },
            toneMappingExposure: {
                value: 1
            }
        },
        vertexShader: `
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
        fragmentShader: `

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`
    },
    Ig = class extends wg {
        constructor() {
            super(), this.isOutputPass = !0, this.uniforms = io.clone(Fg.uniforms), this.material = new co({
                name: Fg.name,
                uniforms: this.uniforms,
                vertexShader: Fg.vertexShader,
                fragmentShader: Fg.fragmentShader
            }), this._fsQuad = new Dg(this.material), this._outputColorSpace = null, this._toneMapping = null
        }
        render(e, t, n) {
            this.uniforms.tDiffuse.value = n.texture, this.uniforms.toneMappingExposure.value = e.toneMappingExposure, (this._outputColorSpace !== e.outputColorSpace || this._toneMapping !== e.toneMapping) && (this._outputColorSpace = e.outputColorSpace, this._toneMapping = e.toneMapping, this.material.defines = {}, Pt.getTransfer(this._outputColorSpace) === `srgb` && (this.material.defines.SRGB_TRANSFER = ``), this._toneMapping === 1 ? this.material.defines.LINEAR_TONE_MAPPING = `` : this._toneMapping === 2 ? this.material.defines.REINHARD_TONE_MAPPING = `` : this._toneMapping === 3 ? this.material.defines.CINEON_TONE_MAPPING = `` : this._toneMapping === 4 ? this.material.defines.ACES_FILMIC_TONE_MAPPING = `` : this._toneMapping === 6 ? this.material.defines.AGX_TONE_MAPPING = `` : this._toneMapping === 7 ? this.material.defines.NEUTRAL_TONE_MAPPING = `` : this._toneMapping === 5 && (this.material.defines.CUSTOM_TONE_MAPPING = ``), this.material.needsUpdate = !0), this.renderToScreen === !0 ? (e.setRenderTarget(null), this._fsQuad.render(e)) : (e.setRenderTarget(t), this.clear && e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil), this._fsQuad.render(e))
        }
        dispose() {
            this.material.dispose(), this._fsQuad.dispose()
        }
    },
    Lg = {
        uniforms: {
            tDiffuse: {
                value: null
            },
            strength: {
                value: 0
            },
            center: {
                value: new H(.5, .45)
            },
            vignette: {
                value: .35
            },
            flash: {
                value: 0
            }
        },
        vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
        fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform vec2 center;
    uniform float vignette;
    uniform float flash;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - center;
      float dist = length(dir);
      float amount = strength * smoothstep(0.12, 0.7, dist);
      vec4 color = vec4(0.0);
      const int SAMPLES = 10;
      for (int i = 0; i < SAMPLES; i++) {
        float t = float(i) / float(SAMPLES - 1);
        color += texture2D(tDiffuse, vUv - dir * amount * t);
      }
      color /= float(SAMPLES);
      float v = smoothstep(0.95, 0.25, dist * (1.0 + vignette));
      color.rgb *= mix(1.0, v, vignette * 1.6);
      color.rgb = mix(color.rgb, vec3(1.0, 0.92, 0.85), flash);
      gl_FragColor = color;
    }
  `
    };

function Rg(e, t, n, r, i) {
    let a = e.getDrawingBufferSize(new H),
        o = new jg(e, new qt(a.x, a.y, {
            type: g,
            samples: i
        }));
    o.addPass(new Mg(t, n)), r && o.addPass(new Pg(new H(window.innerWidth, window.innerHeight), .22, .5, .95));
    let s = new Og(Lg);
    return o.addPass(s), o.addPass(new Ig), {
        composer: o,
        setSpeedBlur(e) {
            s.uniforms.strength.value = e
        },
        setFlash(e) {
            s.uniforms.flash.value = e
        },
        resize(e, t) {
            o.setSize(e, t)
        },
        setPixelRatio(e) {
            o.setPixelRatio(e)
        },
        render() {
            o.render()
        }
    }
}

function zg() {
    let e = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 760;
    return {
        pixelRatio: Math.min(window.devicePixelRatio, e ? 1.5 : 2),
        shadowMapSize: e ? 1024 : 2048,
        bloom: !0,
        msaaSamples: e ? 2 : 4,
        isMobile: e
    }
}

function Bg(e, t) {
    let n = new Mu({
        antialias: !t.isMobile,
        powerPreference: `high-performance`
    });
    return n.setPixelRatio(t.pixelRatio), n.setSize(window.innerWidth, window.innerHeight), n.toneMapping = 4, n.toneMappingExposure = .85, n.outputColorSpace = Re, n.shadowMap.enabled = !0, n.shadowMap.type = 1, e.appendChild(n.domElement), n
}

function $(e) {
    let t = document.getElementById(e);
    if (!t) throw Error(`Missing element #${e}`);
    return t
}

function Vg(e, t) {
    e.classList.toggle(`hidden`, !t)
}
var Hg = Pd.car.maxSpeedKmh,
    Ug = class {
        root = $(`hud`);
        speed = $(`hudSpeed`);
        timer = $(`hudTimer`);
        distance = $(`hudDistance`);
        forceFill = $(`forceFill`);
        forceValue = $(`forceValue`);
        force = this.forceFill.closest(`.force`);
        arc = $(`speedoArc`);
        brakeBtn = $(`brakeBtn`);
        brakeText = $(`brakeText`);
        countdown = $(`countdown`);
        toast = $(`toast`);
        arcLength;
        toastTimer = 0;
        lastSpeedText = ``;
        constructor() {
            this.arcLength = this.arc.getTotalLength(), this.arc.style.strokeDasharray = `${this.arcLength}`, this.arc.style.strokeDashoffset = `${this.arcLength}`;
            let e = $(`speedoMark`),
                t = Math.PI - Pd.brake.minSpeedKmh / Hg * Math.PI;
            e.setAttribute(`x1`, `${100+Math.cos(t)*66}`), e.setAttribute(`y1`, `${110-Math.sin(t)*66}`), e.setAttribute(`x2`, `${100+Math.cos(t)*94}`), e.setAttribute(`y2`, `${110-Math.sin(t)*94}`)
        }
        get brakeButton() {
            return this.brakeBtn
        }
        setVisible(e) {
            Vg(this.root, e)
        }
        update(e) {
            let t = `${Math.round(e.speedKmh)}`;
            t !== this.lastSpeedText && (this.speed.textContent = t, this.lastSpeedText = t);
            let n = Math.min(1, e.speedKmh / Hg);
            this.arc.style.strokeDashoffset = `${this.arcLength*(1-n)}`, this.arc.classList.toggle(`ready`, e.speedKmh >= Pd.brake.minSpeedKmh), this.timer.textContent = `${e.brakeSeconds.toFixed(3)}s`, this.distance.textContent = `${Math.max(0,Math.round(e.distanceToBarrier))}m`;
            let r = e.pedalForce / Pd.brake.breakForceN;
            this.forceFill.style.height = `calc(${Math.min(1,r)*94}% - 2px)`, this.forceValue.textContent = `${Math.round(e.pedalForce)} N`, this.force.classList.toggle(`danger`, r > .85), this.brakeBtn.disabled = !(e.canBrake || e.braking), this.brakeBtn.classList.toggle(`ready`, e.canBrake || e.braking), this.brakeBtn.classList.toggle(`pressed`, e.pressed && (e.canBrake || e.braking)), this.brakeText.textContent = e.braking ? `按住加力` : e.canBrake ? `踩刹车!` : `刹车`
        }
        showCountdown(e) {
            e === null ? Vg(this.countdown, !1) : (this.countdown.textContent = e, Vg(this.countdown, !1), this.countdown.offsetWidth, Vg(this.countdown, !0))
        }
        showToast(e, t = !1, n = 1400) {
            this.toast.textContent = e, this.toast.classList.toggle(`alert`, t), Vg(this.toast, !0), window.clearTimeout(this.toastTimer), this.toastTimer = window.setTimeout(() => Vg(this.toast, !1), n)
        }
        hideToast() {
            window.clearTimeout(this.toastTimer), Vg(this.toast, !1)
        }
    };
async function Wg(e) {
    let t = await e.json().catch(() => ({}));
    if (!e.ok) throw Error(t.error ?? `请求失败 (${e.status})`);
    return t
}
async function Gg(e) {
    return (await Wg(await fetch(`/api/leaderboard?limit=${e}`))).entries
}
async function Kg(e, t, n) {
    return Wg(await fetch(`/api/score`, {
        method: `POST`,
        headers: {
            "content-type": `application/json`
        },
        body: JSON.stringify({
            nickname: e,
            v0: t,
            stopTime: n
        })
    }))
}
var qg = `#f1dcae`,
    Jg = `#ff6a3d`,
    Yg = `#ff3b30`,
    Xg = `rgba(255,255,255,0.08)`,
    Zg = `rgba(245,239,230,0.55)`;

function Qg(e, t) {
    let n = e / t,
        r = 10 ** Math.floor(Math.log10(n)),
        i = n / r;
    return (i < 1.5 ? 1 : i < 3 ? 2 : i < 7 ? 5 : 10) * r
}

function $g(e, t, n, r) {
    let i = e.getContext(`2d`);
    if (!i) return;
    let a = Math.min(window.devicePixelRatio || 1, 2),
        o = e.clientWidth,
        s = e.clientHeight;
    if (o === 0 || s === 0 || (e.width = Math.round(o * a), e.height = Math.round(s * a), i.setTransform(a, 0, 0, a, 0, 0), i.clearRect(0, 0, o, s), t.length < 2)) return;
    let c = {
            l: 34,
            r: 42,
            t: 10,
            b: 20
        },
        l = o - c.l - c.r,
        u = s - c.t - c.b,
        d = Math.max(.5, t[t.length - 1].t),
        f = Math.max(50, Math.ceil(Math.max(...t.map(e => e.speedKmh)) / 50) * 50),
        p = Math.ceil(n * 1.08 / 100) * 100,
        m = e => c.l + e / d * l,
        h = e => c.t + u - e / f * u,
        g = e => c.t + u - e / p * u;
    i.font = `10px -apple-system, "PingFang SC", sans-serif`, i.lineWidth = 1;
    let _ = Qg(f, 4);
    i.textAlign = `right`, i.textBaseline = `middle`;
    for (let e = 0; e <= f + 1e-6; e += _) i.strokeStyle = Xg, i.beginPath(), i.moveTo(c.l, h(e)), i.lineTo(c.l + l, h(e)), i.stroke(), i.fillStyle = qg, i.globalAlpha = .75, i.fillText(`${e}`, c.l - 5, h(e)), i.globalAlpha = 1;
    i.textAlign = `left`;
    for (let e of [0, 500, 1e3]) i.fillStyle = Jg, i.globalAlpha = .75, i.fillText(`${e}`, c.l + l + 5, g(e)), i.globalAlpha = 1;
    let v = Qg(d, 5);
    i.textAlign = `center`, i.textBaseline = `top`, i.fillStyle = Zg;
    for (let e = 0; e <= d + 1e-6; e += v) i.fillText(`${Number(e.toFixed(2))}s`, m(e), c.t + u + 5);
    i.save(), i.setLineDash([4, 4]), i.strokeStyle = Yg, i.globalAlpha = .85, i.beginPath(), i.moveTo(c.l, g(n)), i.lineTo(c.l + l, g(n)), i.stroke(), i.restore(), i.fillStyle = Yg, i.textAlign = `left`, i.textBaseline = `middle`, i.font = `bold 10px -apple-system, "PingFang SC", sans-serif`, i.fillText(`${n}`, c.l + l + 5, g(n)), i.font = `10px -apple-system, "PingFang SC", sans-serif`;
    let y = (e, n) => {
            let r = i.createLinearGradient(0, c.t, 0, c.t + u);
            r.addColorStop(0, `${n}55`), r.addColorStop(1, `${n}00`), i.fillStyle = r, i.beginPath(), i.moveTo(m(t[0].t), c.t + u);
            for (let n of t) i.lineTo(m(n.t), e(n));
            i.lineTo(m(t[t.length - 1].t), c.t + u), i.closePath(), i.fill()
        },
        b = (e, n, r) => {
            i.strokeStyle = n, i.lineWidth = r, i.lineJoin = `round`, i.beginPath(), t.forEach((t, n) => n === 0 ? i.moveTo(m(t.t), e(t)) : i.lineTo(m(t.t), e(t))), i.stroke()
        };
    y(e => g(e.force), Jg), y(e => h(e.speedKmh), qg), b(e => g(e.force), Jg, 1.8), b(e => h(e.speedKmh), qg, 2.2);
    let x = t[t.length - 1];
    if (r) {
        let e = m(x.t),
            t = g(x.force);
        i.strokeStyle = Yg, i.lineWidth = 2.2, i.beginPath(), i.moveTo(e - 5, t - 5), i.lineTo(e + 5, t + 5), i.moveTo(e + 5, t - 5), i.lineTo(e - 5, t + 5), i.stroke()
    } else i.fillStyle = `#5fe0a0`, i.beginPath(), i.arc(m(x.t), h(0), 3.5, 0, Math.PI * 2), i.fill()
}
var e_ = `brake-game:nickname`;

function t_(e) {
    return e.replace(/[&<>"']/g, e => `&#${e.charCodeAt(0)};`)
}
var n_ = class {
        handlers;
        menu = $(`menu`);
        result = $(`result`);
        board = $(`board`);
        boardList = $(`boardList`);
        nickInput = $(`nicknameInput`);
        submitBtn = $(`submitBtn`);
        submitForm = $(`submitForm`);
        submitMsg = $(`submitMsg`);
        lastResult = null;
        chartBox = $(`chartBox`);
        chart = $(`brakeChart`);
        highlightName = null;
        constructor(e) {
            this.handlers = e, this.nickInput.value = localStorage.getItem(e_) ?? ``, $(`startBtn`).addEventListener(`click`, () => {
                e.onClick(), e.onStart()
            }), $(`retryBtn`).addEventListener(`click`, () => {
                e.onClick(), e.onRetry()
            }), $(`boardBtn`).addEventListener(`click`, () => this.openBoard()), $(`resultBoardBtn`).addEventListener(`click`, () => this.openBoard()), $(`boardClose`).addEventListener(`click`, () => {
                e.onClick(), Vg(this.board, !1)
            });
            let t = $(`muteBtn`);
            t.addEventListener(`click`, () => {
                let n = e.onToggleMute();
                t.textContent = n ? `音效：关` : `音效：开`
            }), this.submitForm.addEventListener(`submit`, e => {
                e.preventDefault(), this.submit()
            }), window.addEventListener(`resize`, () => this.drawChart());
            for (let e of [this.menu, this.result, this.board]) e.addEventListener(`pointerdown`, e => e.stopPropagation())
        }
        showMenu(e) {
            Vg(this.menu, e)
        }
        hideAll() {
            Vg(this.menu, !1), Vg(this.result, !1), Vg(this.board, !1)
        }
        showResult(e) {
            this.lastResult = e;
            let t = $(`resultTitle`),
                n = $(`resultSub`);
            e.success ? (t.textContent = `刹停成功`, t.className = `ok`, n.textContent = `稳稳停住，V800 毫发无损`) : e.reason === `brake_snap` ? (t.textContent = `刹车踏板断裂`, t.className = `fail`, n.textContent = `踏板力度达到 ${Pd.brake.breakForceN} N，整车失控翻滚飞出`) : (t.textContent = `撞上路障`, t.className = `fail`, n.textContent = `没能在路障前刹停，再果断一点`);
            let r = e.v0Kmh > 0;
            $(`statV0`).textContent = r ? `${e.v0Kmh.toFixed(1)} km/h` : `-`, $(`statTime`).textContent = r ? `${e.stopSeconds.toFixed(3)} s` : `-`, $(`statDist`).textContent = r ? `${e.stopDistance.toFixed(1)} m` : `-`, $(`statForce`).textContent = r ? `${Math.round(e.peakForce)} N` : `-`, $(`statScore`).textContent = `${e.score}`, Vg(this.submitForm, e.success), this.submitBtn.disabled = !1, this.submitMsg.textContent = e.success ? `` : `翻车不计分，再挑战一次吧`, Vg(this.chartBox, e.samples.length >= 2), Vg(this.result, !0), requestAnimationFrame(() => this.drawChart())
        }
        drawChart() {
            let e = this.lastResult;
            !e || this.result.classList.contains(`hidden`) || e.samples.length < 2 || $g(this.chart, e.samples, Pd.brake.breakForceN, !e.success)
        }
        async submit() {
            let e = this.lastResult,
                t = this.nickInput.value.trim();
            if (e && e.success) {
                if (!t) this.submitMsg.textContent = `请先输入昵称`, this.nickInput.focus();
                else {
                    this.handlers.onClick(), localStorage.setItem(e_, t), this.submitBtn.disabled = !0, this.submitMsg.textContent = `提交中…`;
                    try {
                        let n = await Kg(t, e.v0Kmh, e.stopSeconds);
                        this.highlightName = t, this.submitMsg.textContent = n.score >= n.best ? `已上榜！当前排名第 ${n.rank} 名` : `已提交，你的最佳成绩 ${n.best} 分，排名第 ${n.rank} 名`
                    } catch (e) {
                        this.submitBtn.disabled = !1, this.submitMsg.textContent = e instanceof Error ? e.message : `提交失败`
                    }
                }
            }
        }
        async openBoard() {
            this.handlers.onClick(), Vg(this.board, !0), this.boardList.innerHTML = `<li class="board-empty">加载中…</li>`;
            try {
                let e = await Gg(Pd.leaderboard.limit);
                this.renderBoard(e)
            } catch (e) {
                let t = e instanceof Error ? e.message : `加载失败`;
                this.boardList.innerHTML = `<li class="board-empty">${t_(t)}</li>`
            }
        }
        renderBoard(e) {
            if (e.length === 0) {
                this.boardList.innerHTML = `<li class="board-empty">还没有人上榜，快来抢第一！</li>`;
                return
            }
            let t = this.highlightName ?? localStorage.getItem(e_);
            this.boardList.innerHTML = e.map((e, n) => `<li class="${e.nickname===t?`me`:``}">
          <span class="rank">${n+1}</span>
          <span class="name">${t_(e.nickname)}</span>
          <span class="num mono">${e.v0.toFixed(1)}</span>
          <span class="num mono">${e.stopTime.toFixed(2)}s</span>
          <span class="score-cell mono">${e.score}</span>
        </li>`).join(``)
        }
    },
    r_ = 1 / 120,
    i_ = zg(),
    a_ = $(`app`),
    o_ = Bg(a_, i_),
    s_ = new Pn,
    c_ = new ag(window.innerWidth / window.innerHeight),
    l_ = pg(s_, o_, i_.shadowMapSize),
    u_ = Rg(o_, s_, c_.camera, i_.bloom, i_.msaaSamples),
    d_ = Jh(s_);
d_.resize(window.innerHeight * i_.pixelRatio);
var f_ = Md();
s_.add(f_.root);
var p_ = new Lu,
    m_ = new ng,
    h_ = new Ug,
    g_ = !1,
    __ = !1,
    v_ = 0,
    y_ = 0,
    b_ = 0,
    x_ = 0,
    S_ = null,
    C_ = 0,
    w_ = 0,
    T_ = 0,
    E_ = new Ih(s_, f_, l_.barrierBlocks, d_, {
        onImpact(e) {
            p_.impact(e), c_.addShake(.25 * e)
        }
    }),
    D_ = new n_({
        onStart: k_,
        onRetry: k_,
        onToggleMute() {
            return p_.setMuted(!p_.muted), p_.muted
        },
        onClick() {
            p_.unlock(), p_.uiClick()
        }
    });

function O_() {
    E_.reset(), f_.root.position.set(0, 0, 0), f_.root.quaternion.identity(), f_.body.rotation.set(0, 0, 0), f_.setBrakeHeat(0), f_.setBrakeLights(1.6), d_.clear(), v_ = 0, w_ = 0, C_ = 0
}

function k_() {
    p_.unlock(), O_(), D_.hideAll(), h_.setVisible(!0), h_.hideToast(), S_ = null, x_ = 0, g_ = !1, m_.start(), c_.setMode(`chase`), p_.ignition(), window.setTimeout(() => {
        m_.phase === `countdown` && p_.startLoops()
    }, 750)
}

function A_(e) {
    for (let t of e) switch (t.type) {
        case `countdown`:
            h_.showCountdown(`${t.value}`), p_.countdownBeep(!1), p_.revBlip();
            break;
        case `start`:
            h_.showCountdown(`GO`), p_.countdownBeep(!0), window.setTimeout(() => h_.showCountdown(null), 700);
            break;
        case `brake_too_early`:
            h_.showToast(`车速达到 ${Pd.brake.minSpeedKmh} km/h 后才能刹车`), p_.warn();
            break;
        case `brake_start`:
            c_.setMode(`brake`), N_(20), p_.brakeClick(), h_.showToast(`动力切断 · 初速度 ${t.v0Kmh.toFixed(1)} km/h`);
            break;
        case `stopped`:
            c_.setMode(`finish`), p_.stopLoops(1.2), p_.success(), N_([30, 50, 30]), h_.showToast(`完美刹停！`, !1, 1600), S_ = t.result, x_ = 1.8;
            break;
        case `crash`: {
            let e = m_.dynamics.speed;
            c_.setMode(`crash`), f_.body.rotation.set(0, 0, 0), E_.begin(t.reason, e), b_ = 0, t.reason === `brake_snap` ? (p_.snap(), y_ = .85, c_.addShake(.6), h_.showToast(`刹车踏板断裂！`, !0, 2200)) : (p_.impact(1), y_ = .5, c_.addShake(.8), h_.showToast(`撞上路障！`, !0, 2200)), p_.stopLoops(.6), p_.fail(), N_([90, 40, 200]), S_ = t.result, x_ = Pd.crash.resultDelaySeconds;
            break
        }
    }
}

function j_(e, t) {
    if (e < .55 || t < 4) return;
    let n = (e - .55) / .45;
    if (Math.random() > n * .9) return;
    let r = f_.root.position.z,
        i = new U,
        a = new U;
    for (let e of [-1, 1]) a.set(e * .86, .15, r - 1.62 + .3), i.set(e * (.5 + Math.random()), .4 + Math.random() * .8, -t * .35), d_.smoke.emit(a, i, .5 + n * .6, 1.2 + Math.random(), .25 + n * .25)
}

function M_(e) {
    let t = m_.step(e, g_ || __);
    __ = !1, A_(t)
}

function N_(e) {
    `vibrate` in navigator && navigator.vibrate(e)
}

function P_(e) {
    let t = m_.dynamics,
        n = C_ / r_,
        r = w_ + (t.distance - w_) * n,
        i = f_.root.position.z;
    f_.root.position.z = -r, f_.spinWheels(i - f_.root.position.z, e);
    let a = Et.clamp(t.accel * .0045, -.05, .03);
    f_.body.rotation.x += (a - f_.body.rotation.x) * Math.min(1, e * 4);
    let o = t.pedalForce / Pd.brake.breakForceN;
    v_ = Math.min(1, Math.max(0, v_ + (o * t.speed * .012 - .12) * e)), f_.setBrakeHeat(v_), f_.setBrakeLights(m_.phase === `braking` && t.pedalForce > 1 ? 8 : 1.6), j_(o, t.speed)
}

function F_(e) {
    T_ += e;
    let t = e;
    if (m_.phase === `crashed` && E_.active) {
        b_ += e;
        let n = Pd.crash.slowMoSeconds;
        t = e * (b_ < n ? Pd.crash.slowMoScale : Math.min(1, Pd.crash.slowMoScale + (b_ - n) * .8)), E_.update(t)
    } else {
        for (C_ += e; C_ >= r_;) C_ -= r_, w_ = m_.dynamics.distance, (m_.phase === `countdown` || m_.phase === `accelerating` || m_.phase === `braking`) && M_(r_);
        m_.phase !== `crashed` && P_(e)
    }
    d_.update(t);
    let n = m_.dynamics,
        r = m_.phase === `countdown` || m_.phase === `accelerating` || m_.phase === `braking`;
    if (r && p_.update({
            speedKmh: n.speedKmh,
            powered: !n.powerCut,
            pedalForce: n.pedalForce,
            breakForce: Pd.brake.breakForceN,
            rolling: m_.phase !== `countdown`
        }, e), S_ && (x_ -= e, x_ <= 0)) {
        let e = S_;
        S_ = null, h_.setVisible(!1), D_.showResult(e)
    }
    h_.update({
        speedKmh: m_.phase === `crashed` ? E_.carSpeed * 3.6 : n.speedKmh,
        brakeSeconds: m_.brakeElapsed,
        distanceToBarrier: m_.distanceToBarrier,
        pedalForce: n.pedalForce,
        canBrake: m_.canBrake,
        braking: m_.phase === `braking`,
        pressed: g_
    });
    let i = m_.phase === `crashed` ? E_.focus : f_.root.position;
    c_.update(e, i, n.speed), l_.update(i, T_);
    let a = r && m_.phase !== `countdown` ? Math.min(1, n.speed / 72) ** 1.6 * .07 : 0;
    u_.setSpeedBlur(a), y_ = Math.max(0, y_ - e * 2.2), u_.setFlash(y_), u_.render()
}

function I_(e) {
    g_ !== e && (g_ = e, e && (__ = !0), e && m_.phase === `braking` && p_.brakeClick())
}
h_.brakeButton.addEventListener(`pointerdown`, e => {
    e.preventDefault(), p_.unlock(), I_(!0)
}), a_.addEventListener(`pointerdown`, e => {
    (m_.phase === `accelerating` || m_.phase === `braking`) && (e.preventDefault(), I_(!0))
});
for (let e of [`pointerup`, `pointercancel`, `blur`]) window.addEventListener(e, () => I_(!1));
window.addEventListener(`keydown`, e => {
    if (!(e.target instanceof HTMLInputElement) && e.code === `Space`) {
        if (e.preventDefault(), m_.phase === `menu` && !e.repeat && document.activeElement === document.body) {
            k_();
            return
        }
        I_(!0)
    }
}), window.addEventListener(`keyup`, e => {
    e.code === `Space` && I_(!1)
}), window.addEventListener(`contextmenu`, e => e.preventDefault()), document.addEventListener(`visibilitychange`, () => {
    document.hidden && I_(!1)
}), document.addEventListener(`touchmove`, e => {
    (e.target instanceof Element ? e.target : null)?.closest(`.panel`) || e.preventDefault()
}, {
    passive: !1
}), document.addEventListener(`gesturestart`, e => e.preventDefault());
var L_ = i_.pixelRatio;

function R_() {
    let e = window.innerWidth,
        t = window.innerHeight;
    o_.setPixelRatio(L_), o_.setSize(e, t), c_.resize(e / t), u_.setPixelRatio(L_), u_.resize(e, t), d_.resize(t * L_)
}
window.addEventListener(`resize`, R_), window.addEventListener(`orientationchange`, () => window.setTimeout(R_, 250)), window.visualViewport?.addEventListener(`resize`, R_);
var z_ = {
    frames: 0,
    time: 0,
    fastStreak: 0
};

function B_(e) {
    if (z_.frames++, z_.time += e, z_.time < 2) return;
    let t = z_.frames / z_.time;
    z_.frames = 0, z_.time = 0;
    let n = i_.isMobile ? .9 : 1;
    t < 45 && L_ > n ? (L_ = Math.max(n, L_ - .25), z_.fastStreak = 0, R_()) : t > 58 && L_ < i_.pixelRatio ? (z_.fastStreak++, z_.fastStreak >= 3 && (L_ = Math.min(i_.pixelRatio, L_ + .25), z_.fastStreak = 0, R_())) : z_.fastStreak = 0
}
$(`keyHint`).textContent = i_.isMobile ? `按住屏幕任意位置或右下角按钮踩刹车` : `按住空格 / 鼠标左键踩刹车`, O_(), c_.setMode(`showcase`), D_.showMenu(!0);
var V_ = performance.now();

function H_(e) {
    let t = Math.min(.05, (e - V_) / 1e3);
    V_ = e, F_(t), B_(t), requestAnimationFrame(H_)
}
requestAnimationFrame(e => {
    V_ = e, F_(.016), $(`loading`).classList.add(`done`), requestAnimationFrame(H_)
