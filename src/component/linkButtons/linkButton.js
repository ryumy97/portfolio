import * as THREE from 'https://unpkg.com/three/build/three.module.js';

export class LinkButton {
    constructor(container, asset) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.zoom = 3;
        const light = new THREE.PointLight(0xffffff, 1.5)
        light.position.set(2, 2, 5)
        this.scene.add(light)

        const ambient = new THREE.AmbientLight(0xffffff, 0.6);        
        this.scene.add(ambient)

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x00000000, 0);
        this.renderer.setPixelRatio( window.devicePixelRatio );

        container.append(this.renderer.domElement);

        const shape = new THREE.Shape();
        const x = 0;
        const y = 0;
        const width = 6;
        const height = 6;
        const cornerRadius = 1.5
        shape.moveTo(x - width / 2 + cornerRadius, y + height / 2);
        shape.lineTo(x + width / 2 - cornerRadius, y + height / 2);

        shape.quadraticCurveTo(
            x + width / 2, y + height / 2,
            x + width / 2, y + height / 2 - cornerRadius
            );

        shape.lineTo(x + width / 2, y - height / 2 + cornerRadius);

        shape.quadraticCurveTo(
            x + width / 2, y - height / 2,
            x + width / 2 - cornerRadius, y - height / 2
        );

        shape.lineTo(x - width / 2 + cornerRadius, y - height / 2);

        shape.quadraticCurveTo(
            x - width / 2, y - height / 2,
            x - width / 2, y - height / 2 + cornerRadius
            );

        shape.lineTo(x - width / 2, y + height / 2 - cornerRadius);

        shape.quadraticCurveTo(
            x - width / 2, y + height / 2,
            x - width / 2 + cornerRadius, y + height / 2
            );

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 1,
        });

        const faceTexture = new THREE.TextureLoader().load(asset, (t) => {
            t.offset.set(0.5, 0.5)
            t.repeat.set(1/width,1/height)
        });

        faceTexture.wrapS = THREE.ClampToEdgeWrapping;
        faceTexture.wrapT = THREE.RepeatWrapping;

        const sideImageTexture = new THREE.TextureLoader().load(asset)
        
        const sideTextureMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {
                    texture1: {
                        type: 't', value: sideImageTexture
                    }
                }
            ]),
            vertexShader:
            `
                varying vec2 vUv;
                varying vec2 vPosition;
                varying vec3 vPos;
                varying vec3 vNormal;

                void main() {
                    vUv = uv;
                    vPosition = position.xy;
                    vPos = (modelMatrix * vec4(position, 1.0 )).xyz;
                    vNormal = normalMatrix * normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: 
            `
                varying vec2 vUv;
                varying vec2 vPosition;
                uniform sampler2D texture1;

                varying vec3 vPos;
                varying vec3 vNormal;

                struct PointLight {
                    vec3 position;
                    vec3 color;
                };
                
                uniform PointLight pointLights[1];
                uniform PointLight ambientLights[1];

                void main() {
                    vec2 colorLocation;
                    colorLocation = (vPosition + 3.0) / 6.0;

                    vec3 color = texture2D(texture1, colorLocation).xyz;

                    vec4 addedLights = vec4(0.6, 0.6, 0.6, 1.0);
                    for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
                        vec3 adjustedLight = pointLights[l].position + cameraPosition;
                        vec3 lightDirection = normalize(vPos - adjustedLight);
                        addedLights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) * pointLights[l].color * 0.3;
                      }
                      
                    gl_FragColor = vec4(color, 1) * addedLights;
                }
            `,
            wireframe: false,
            lights: true
        });

        const faceTextureMaterial = new THREE.MeshStandardMaterial({ 
            map: faceTexture,
            opacity: 1,
            visible: true,
            roughness: 1,
            metalness: 0.5,
            wireframe: false
        });

        this.box = new THREE.Mesh(geometry, [faceTextureMaterial, sideTextureMaterial, faceTextureMaterial]);
        this.scene.add(this.box);

        this.camera.position.set(0,0,20);
   
        this.targetRotation = {
            x: -Math.PI * 2,
            y: 0,
            z: Math.PI * 2
        } 

        this.renderer.domElement.addEventListener('pointermove', this.onMove.bind(this), false);
    }

    resize(stageWidth, stageHeight) {
        this.stageWidth = stageWidth;
        this.stageHeight = stageHeight;
        
        this.camera.aspect = stageWidth / stageHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(stageWidth, stageHeight);
    }

    draw(progress) {
        if (progress < 1) {

        }
        else {
            this.box.rotation.x += (this.targetRotation.x - this.box.rotation.x) * 0.05;
            this.box.rotation.z += (this.targetRotation.z - this.box.rotation.z) * 0.05;

            this.targetRotation.x += (0 - this.targetRotation.x) * 0.01;
            this.targetRotation.z += (0 - this.targetRotation.z) * 0.01;
        }
        this.renderer.render(this.scene, this.camera);
    }

    onMove(e) {
        this.targetRotation.z = (e.clientX - this.renderer.domElement.offsetLeft - this.renderer.domElement.offsetWidth / 2) * 0.1 + Math.PI / 4;
        this.targetRotation.x = (e.clientY - this.renderer.domElement.offsetTop - this.renderer.domElement.offsetHeight / 2) * 0.1 - Math.PI / 4 ;
    }

    getElement() {
        return this.renderer.domElement;
    }
}