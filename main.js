import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

let camera, scene, renderer;
let controls, water, sun;
let temp; 

const loader = new GLTFLoader();

class Boat {
  constructor(){
    loader.load("assets/boat/scene.gltf", (gltf) => {
      scene.add( gltf.scene )
      gltf.scene.scale.set(3, 3, 3)
      gltf.scene.position.set(5,13,50)
      gltf.scene.rotation.y = 1.5

      this.boat = gltf.scene
      this.speed = {
        vel: 0,
        rot: 0
      }
      
      
    })
  }

  stop(){
    this.speed.vel = 0
    this.speed.rot = 0
  }

  update(){
    if(this.boat){
      this.boat.rotation.y += this.speed.rot
      this.boat.translateX(this.speed.vel)
      
    }
  }

  
}

class Island{
  constructor(){
    loader.load("assets/island/scene.gltf", (gltf) => {
      scene.add( gltf.scene )
      gltf.scene.scale.set(30, 30, 30)
      gltf.scene.position.set(-5,-3,-200)      

      this.island = gltf.scene
      
    })
  }
}

const boat = new Boat()
const island = new Island()

async function loadModel(url){
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      resolve(gltf.scene)
    })
  })
}

let boatModel = null

init();
animate();

async function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild( renderer.domElement );  

  scene = new THREE.Scene();  
  camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.1, 20000 ); 
  camera.position.set( 30, 30, 200 );
 
  scene.add(camera);
  sun = new THREE.Vector3();
  
  // Water

  const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load( 'assets/waternormals.jpg', function ( texture ) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

      } ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = - Math.PI / 2;

  scene.add( water );

  // Skybox

  const sky = new Sky();
  sky.scale.setScalar( 10000 );
  scene.add( sky );

  const skyUniforms = sky.material.uniforms;

  skyUniforms[ 'turbidity' ].value = 10;
  skyUniforms[ 'rayleigh' ].value = 2;
  skyUniforms[ 'mieCoefficient' ].value = 0.005;
  skyUniforms[ 'mieDirectionalG' ].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  function updateSun() {

    const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
    const theta = THREE.MathUtils.degToRad( parameters.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

    scene.environment = pmremGenerator.fromScene( sky ).texture;

  }

  updateSun();

  controls = new OrbitControls( camera, renderer.domElement );
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set( 0, 10, 0 );
  controls.minDistance = 40.0;
  controls.maxDistance = Infinity;


  const waterUniforms = water.material.uniforms;

  
  window.addEventListener( 'resize', onWindowResize );

  window.addEventListener( 'keydown', function(e){
    
    if(e.key == "ArrowUp"){
      boat.speed.vel = 1      
      fitCameraToObject(camera, boat.boat, 1);
      
    }
    if(e.key == "ArrowDown"){
      boat.speed.vel = -1
      fitCameraToObject(camera, boat.boat, 2);
    }
    if(e.key == "ArrowRight"){
      boat.speed.rot = -0.1
      fitCameraToObject(camera, boat.boat, 3);
    }
    if(e.key == "ArrowLeft"){
      boat.speed.rot = 0.1
      fitCameraToObject(camera, boat.boat, 4);
    }  
    
    //time += 0.01;

    
  })
  window.addEventListener( 'keyup', function(e){
    boat.stop()    
  })  
  
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();  
  renderer.setSize( window.innerWidth, window.innerHeight );
  render()
}

function fitCameraToObject( camera, object, type ) {
  temp = new THREE.Vector3();
  temp.setFromMatrixPosition(object.matrixWorld);
  if(type == 1)
    camera.translateZ(-2);
    //camera.position.lerp(temp, 0.2);
  if(type == 2)
  camera.position.lerp(temp, 0.2);    
 
  camera.lookAt(object.position);
  controls.target = object.position;
  
  
  //camera.set(object.position);
  
}

function animate() {
  requestAnimationFrame( animate );  
  controls.update();
  render();  
  boat.update()
    
}

function render() {
  water.material.uniforms[ 'time' ].value += 1.0 / 60.0;  
  renderer.render( scene, camera ); 
}

