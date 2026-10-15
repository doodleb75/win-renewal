import * as THREE from 'three';

/**
 * Amaterasu-Inspired Deep Cyan / Teal Ambient Light Background
 * - amaterasu.ai 특유의 깊고 신비로운 딥 시안/틸/미드나잇 다크 앰비언스
 * - 광원이 너무 세지 않고 묵직하며, 눈부신 흰색 하이라이트 배제
 * - 마우스 움직임에 따라 조명의 위치, 반경, 색온도가 은은하게 반응하고 변화
 * - 화면 모서리가 절대 잘리지 않는 100% 무결점 풀스크린 셰이더 시스템
 */
export class FluidGradientBackground {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn(`[FluidGradientBackground] Container #${containerId} not found.`);
            return;
        }

        this.options = {
            // amaterasu.ai 실제 공식 컬러 팔레트 (Biscay Navy Blue + Downy Soft Cyan)
            colorVoid: new THREE.Color('#061120'),       // 가장 깊은 미드나잇 다크 네이비 (#061120)
            colorDeepNavy: new THREE.Color('#0d2545'),   // 딥 비스케이 네이비 베이스 (#0d2545)
            colorBiscay: new THREE.Color('#183969'),     // amaterasu.ai 메인 비스케이 블루 (#183969)
            colorMidCyan: new THREE.Color('#2d788d'),    // 중간 톤 오션 시안 (#2d788d)
            colorDowny: new THREE.Color('#75cdd6'),      // amaterasu.ai 시그니처 다운이 시안 글로우 (#75cdd6)
            grainIntensity: 0.018,                       // 매트한 필름 입자감
            lightSmoothness: 0.045,                      // 마우스 추적 부드러움 (lerp)
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.material = null;
        this.mesh = null;
        this.clock = new THREE.Clock();

        this.mouse = {
            x: 0.5, y: 0.5,
            targetX: 0.5, targetY: 0.5,
            lastX: 0, lastY: 0,
            lastTime: performance.now(),
            speed: 0
        };

        this._onResize = this._onResize.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._animate = this._animate.bind(this);

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. 모서리 잘림이 물리적으로 절대 불가능한 2D Orthographic 카메라 (화면 1:1 풀스크린)
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // 2. 고성능 WebGL 렌더러
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        this.renderer.domElement.style.pointerEvents = 'none';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';

        this.container.appendChild(this.renderer.domElement);

        // 3. 풀스크린 Plane (2x2 Quad)
        const geometry = new THREE.PlaneGeometry(2, 2);

        // 4. 정점 셰이더
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        // 5. 프래그먼트 셰이더: amaterasu.ai 시그니처 비스케이 블루 & 다운이 시안 라이팅
        const fragmentShader = `
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_speed;
            uniform vec3 u_colorVoid;
            uniform vec3 u_colorDeepNavy;
            uniform vec3 u_colorBiscay;
            uniform vec3 u_colorMidCyan;
            uniform vec3 u_colorDowny;
            uniform float u_grain;

            varying vec2 vUv;

            // 고운 아날로그 필름 그레인
            float fineGrain(vec2 uv) {
                return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
            }

            void main() {
                // 화면 종횡비 보정 좌표 (-1.0 ~ 1.0, 중심이 0,0)
                vec2 st = (vUv - 0.5) * 2.0;
                float aspect = u_resolution.x / u_resolution.y;
                st.x *= aspect;

                // 마우스 인터랙티브 좌표 변환
                vec2 mousePos = (u_mouse - 0.5) * 2.0;
                mousePos.x *= aspect;

                float t = u_time * 0.25;

                // --- 1. 마우스에 따라 움직이고 숨쉬는 메인 앰비언트 조명 ---
                vec2 light1Pos = mousePos * 0.72 + vec2(0.08 * cos(t * 0.8), 0.06 * sin(t * 0.6));
                vec2 d1 = st - light1Pos;
                float distSq1 = dot(d1 * vec2(1.0, 1.25), d1 * vec2(1.0, 1.25));
                
                // 마우스 속도에 따른 자연스러운 호흡 반경
                float radius1 = 1.7 + u_speed * 0.3;
                float mainGlow = exp(-distSq1 / (radius1 * radius1));

                // --- 2. amaterasu.ai 특유의 우측 상단 메인 비스케이/다운이 앰비언스 빛 ---
                vec2 light2Pos = vec2(0.40 * aspect, 0.28) + vec2(0.10 * sin(t * 0.5), 0.07 * cos(t * 0.7));
                float distSq2 = dot(st - light2Pos, st - light2Pos);
                float subGlow = exp(-distSq2 / 3.4);

                // --- 3. 마우스 위치에 따른 실시간 조명 색조(Tone) 변화 ---
                // 마우스가 움직이면 비스케이 블루와 다운이 시안의 비율이 유기적으로 부드럽게 시프트
                float toneShift = clamp((u_mouse.x - 0.5) * 0.7 + 0.5, 0.0, 1.0);
                vec3 dynamicGlow = mix(u_colorMidCyan, u_colorDowny, toneShift * 0.6 + 0.2);
                vec3 dynamicBase = mix(u_colorDeepNavy, u_colorBiscay, 0.4 + 0.3 * sin(t * 0.5));

                // --- 4. amaterasu.ai 감성의 고요하고 우아한 컬러 레이어링 ---
                vec3 col = u_colorVoid;
                // 베이스 네이비
                col = mix(col, dynamicBase, clamp(subGlow * 0.90 + mainGlow * 0.45, 0.0, 1.0));
                // 비스케이 블루 앰비언스
                col = mix(col, u_colorBiscay, clamp(mainGlow * 0.70 + subGlow * 0.6, 0.0, 1.0));
                // 오션 시안 중간 톤
                col = mix(col, u_colorMidCyan, smoothstep(0.18, 0.80, mainGlow));
                // 다운이 시안 글로우 (눈부시지 않은 소프트 시안)
                float core = smoothstep(0.55, 0.98, mainGlow);
                col = mix(col, dynamicGlow, core * 0.75);

                // --- 5. 화면 가장자리의 비네팅 (외곽을 고급스럽고 고요하게 유지) ---
                float cornerDist = length((vUv - 0.5) * vec2(1.1, 1.0));
                float vignette = smoothstep(1.35, 0.35, cornerDist);
                col *= (0.78 + 0.22 * vignette);

                // --- 6. 아날로그 필름 매트 그레인 질감 ---
                float grain = (fineGrain(vUv * 85.0 + fract(u_time * 0.02)) - 0.5) * u_grain;
                col += grain;

                gl_FragColor = vec4(col, 1.0);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(width, height) },
                u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
                u_speed: { value: 0 },
                u_colorVoid: { value: this.options.colorVoid },
                u_colorDeepNavy: { value: this.options.colorDeepNavy },
                u_colorBiscay: { value: this.options.colorBiscay },
                u_colorMidCyan: { value: this.options.colorMidCyan },
                u_colorDowny: { value: this.options.colorDowny },
                u_grain: { value: this.options.grainIntensity }
            },
            depthWrite: false,
            depthTest: false
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        window.addEventListener('resize', this._onResize, { passive: true });
        window.addEventListener('mousemove', this._onMouseMove, { passive: true });

        this._animate();
    }

    _onMouseMove(e) {
        const now = performance.now();
        const dt = Math.max(now - this.mouse.lastTime, 16);

        // 0.0 ~ 1.0 정규화 마우스 좌표
        const targetX = e.clientX / window.innerWidth;
        const targetY = 1.0 - (e.clientY / window.innerHeight);

        // 마우스 이동 거리 및 속도 계산
        const dx = e.clientX - this.mouse.lastX;
        const dy = e.clientY - this.mouse.lastY;
        const dist = Math.hypot(dx, dy);
        const speed = (dist / dt) * 10;

        this.mouse.targetX = targetX;
        this.mouse.targetY = targetY;
        this.mouse.speed = Math.min(speed * 0.08, 1.0);

        this.mouse.lastX = e.clientX;
        this.mouse.lastY = e.clientY;
        this.mouse.lastTime = now;
    }

    _onResize() {
        if (!this.container || !this.renderer || !this.material) return;
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.renderer.setSize(width, height);
        this.material.uniforms.u_resolution.value.set(width, height);
    }

    _animate() {
        requestAnimationFrame(this._animate);

        const elapsedTime = this.clock.getElapsedTime();
        this.material.uniforms.u_time.value = elapsedTime;

        // 마우스 추적 부드러운 감속 (lerp) - 심해 물속처럼 고요하고 부드럽게
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * this.options.lightSmoothness;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * this.options.lightSmoothness;
        this.mouse.speed *= 0.93; // 속도 감쇠

        this.material.uniforms.u_mouse.value.set(this.mouse.x, this.mouse.y);
        this.material.uniforms.u_speed.value = this.mouse.speed;

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        window.removeEventListener('resize', this._onResize);
        window.removeEventListener('mousemove', this._onMouseMove);
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.remove();
            this.renderer.dispose();
        }
    }
}

// 자동 마운트
if (typeof document !== 'undefined') {
    const initBg = () => {
        const target = document.getElementById('threejs-background-container');
        if (target && !window.__fluidGradientBgInstance) {
            window.__fluidGradientBgInstance = new FluidGradientBackground('threejs-background-container');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBg);
    } else {
        initBg();
    }
}
