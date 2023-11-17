import * as THREE from 'three';

class JulieShader {
    constructor() {

    }

    async initialize() {
        this.renderer = new THREE.WebGLRenderer()
        document.body.appendChild(this.renderer.domElement)

        window.addEventListener('resize', () => {
            this.onWindowResize()
        }, false)

        this.scene = new THREE.Scene();
        this.bufferScene = new THREE.Scene();

        this.dimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        //Screen resolution
        this.resolution = new THREE.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            window.devicePixelRatio
        );


        // Create a new framebuffer we will use to render to
        // the video card memory
        this.renderBufferA = new THREE.WebGLRenderTarget(
            this.dimensions.width,
            this.dimensions.height, {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType,
                stencilBuffer: false
            }
        )
        // Create a new framebuffer we will use to render to
        // the video card memory
        this.renderBufferB = new THREE.WebGLRenderTarget(
            this.dimensions.width,
            this.dimensions.height, {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType,
                stencilBuffer: false
            }
        )

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 100);
        // this.camera = new THREE.PerspectiveCamera(45, this.dimensions.width / this.dimensions.height, 1, 1000);
        // this.camera.position.z = 1;

        await this.setupProject();

        this.previousRAF = null;
        this.onWindowResize();
        this.raf()
    }

    async setupProject() {
        const dataTexture = this.createDataTexture();
        const loader = new THREE.TextureLoader();

        // Buffer Material
        this.bufferMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: {
                    value: dataTexture
                },
                uResolution: {
                    value: this.resolution
                },
                uMouse: {
                    value: {
                        x: 1.0,
                        y: 1.0
                    }
                },
                uTextureTwo: { type: "t", value: loader.load( "test.png" ) }
            },
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShaderBuffer').textContent
        });


        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: {
                    value: null
                },
                uResolution: {
                    value: this.resolution
                },
                uMouse: {
                    value: {
                        x: 1.0,
                        y: 1.0
                    }
                },
                uTextureTwo: { type: "t", value: loader.load( "test.png" ) }
            },
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShaderScreen').textContent
        })

        const geometry = new THREE.PlaneGeometry(2, 2);
        // const geometry = new THREE.BoxGeometry(2, 2, 2);

        // Meshes
        this.bufferMesh = new THREE.Mesh(geometry, this.bufferMaterial);
        this.bufferScene.add(this.bufferMesh)


        this.planeMesh = new THREE.Mesh(geometry, this.material)
        this.scene.add(this.planeMesh)

        document.addEventListener('mousemove', (e) => {
            this.material.uniforms.uMouse.value.x = e.clientX;
            this.material.uniforms.uMouse.value.y = e.clientY;
            
            this.bufferMaterial.uniforms.uMouse.value.x = e.clientX;
            this.bufferMaterial.uniforms.uMouse.value.y = e.clientY;
        })
    }

    onWindowResize() {
        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        // this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        this.dimensions.width = window.innerWidth
        this.dimensions.height = window.innerHeight

        // Update camera
        this.camera.updateProjectionMatrix()

        // //update uniforms
        this.material.uniforms.uResolution.value.x = this.dimensions.width
        this.material.uniforms.uResolution.value.y = this.dimensions.height

        this.bufferMaterial.uniforms.uResolution.value.x = this.dimensions.width
        this.bufferMaterial.uniforms.uResolution.value.y = this.dimensions.height
    }

    raf() {
        requestAnimationFrame(t => {
            if (this.previousRAF === null) {
                this.previousRAF = t;
                this.setupProject(t - this.previousRAF)
            }

            // this.planeMesh.rotation.z += .01;

            this.renderer.setRenderTarget(this.renderBufferA);
            this.renderer.render(this.bufferScene, this.camera)

            this.planeMesh.material.uniforms.uTexture.value = this.renderBufferA.texture;

            this.renderer.setRenderTarget(null);
            this.renderer.render(this.scene, this.camera)

            const temp = this.renderBufferA
            this.renderBufferA = this.renderBufferB
            this.renderBufferB = temp
            //output becomes input
            this.bufferMaterial.uniforms.uTexture.value = this.renderBufferB.texture;

            this.raf()
            this.previousRAF = t
        })
    }


    /**
     * CREATE RANDOM NOISY TEXTURE
     */
    createDataTexture() {
        // create a buffer with color data

        var size = this.dimensions.width * this.dimensions.height;
        var data = new Uint8Array(4 * size);

        for (var i = 0; i < size; i++) {
            var stride = i * 4;

            if (Math.random() < 0.01) {
                data[stride] = Math.floor(Math.random() * 255);
                data[stride + 1] = Math.floor(Math.random() * 255);
                data[stride + 2] =Math.floor(Math.random() * 255);
                data[stride + 3] = 255;
            } else {
                data[stride] = 0;
                data[stride + 1] =0;
                data[stride + 2] = 0;
                data[stride + 3] = 255;
            }
            
            // data[stride] = 0;
            // data[stride + 1] =0;
            // data[stride + 2] = 0;
            // data[stride + 3] = 255;
        }

        // used the buffer to create a DataTexture

        // console.log(data);
        var texture = new THREE.DataTexture(
            data,
            this.dimensions.width,
            this.dimensions.height,
            THREE.RGBAFormat
        );
        texture.needsUpdate = true;

        return texture;
    }

}

let APP = null
window.addEventListener('DOMContentLoaded', async () => {
    APP = new JulieShader();
    await APP.initialize()
})