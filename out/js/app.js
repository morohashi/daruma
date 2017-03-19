(function(){
	//DOM
	var dom = {
		title : document.getElementById("title"),
		shot : document.getElementById("shot"),
		game: document.getElementById("game"),
		gauge : document.getElementById("gauge"),
		stageNum_ : document.querySelector(".num10"),
		stageNum : document.querySelector(".num01")
	};

	//ローディング
	document.body.classList.add("loaded");
	//タイトル画面
	dom.title.addEventListener('touchstart',function(e){
		document.body.classList.add("titleend");
		game.play(0);
	});
	//打ボタン設定
	dom.shot.addEventListener('touchstart',function(e){
		if(game.isPlay && !game.hammerAnimation){
			game.hammerAnimation = true;
			itemList.hammer.rotation.y = 30*(Math.PI/180);
			var tm = new TimelineMax({});
			tm.to(itemList.hammer.rotation,0.4,{
				y:390*(Math.PI/180),
				ease: Cubic.easeInOut,
				onComplete:function(){
					game.hammerAnimation = false;
				}
			},0);
		}
	});

	//シーン
	var scene = new THREE.Scene();
	//カメラ
	var camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
	camera.position.y = 8;
	camera.position.z = 8;
	camera.rotation.set(-0.5,0,0);
	//ライティング
	var light = new THREE.AmbientLight( 0xb6b6b6 ,1); // soft white light
	scene.add( light );
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.2 );
	scene.add( directionalLight );
	//レンダラー
	var renderer = new THREE.WebGLRenderer({
		alpha:true,
		antialias:true
	});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(window.innerWidth,window.innerHeight);
	renderer.shadowMap.enabled = true;
	//アウトライン
	effect = new THREE.OutlineEffect( renderer ,{
		defaultThickNess: 0.1
	});
	dom.game.appendChild(renderer.domElement);
	//物理初期化
	var world = new CANNON.World();
	world.gravity.set(0, -1, 0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;
	world.solver.tolerance = 0.000001;
	world.defaultContactMaterial.contactEquationStiffness = 5e6;
	world.defaultContactMaterial.contactEquationRelaxation = 3;
	var mass = 1;
	//

	//
	/*//////////////////////////////////////
	///////////////////////////////////////*/
	var state = {
		index : 0
	};

	var stage = [
		//ステージ1
		{
			lasttime : 10,
			block : 5
		}
	];

	var game = {
		time:null,
		isPlay:false,
		hammerAnimation:false,
		lastCount:0,
		fulltime:0,
		play:function(i){
			this.lastCount = stage[i].lasttime * 60;
			this.fulltime =  this.lastCount;
			//ベース
			stageItem.addBase();
			//ハンマー
			stageItem.addHammer();
			//block
			for(var v=0; v<stage[i].block; v++){
				stageItem.addBlock(v);
			}
			var mat = new CANNON.ContactMaterial(materials.base, materials.block, { friction: 0.0, restitution: 0.0 });
			world.addContactMaterial(mat);
			var mat2 = new CANNON.ContactMaterial(materials.block, materials.block, { friction: 0.0, restitution: 0.0 });
			world.addContactMaterial(mat2);
			//UI初期化
			ui.stageNum(i);
			var o = this;
			o.isPlay = true;
			setTimeout(function(){
				o.update();
			},1000);
		},
		update:function(){
			var o = this;
			this.time = setInterval(function(){
				o.lastCount--;
				dom.gauge.style.width = 100 - ((o.lastCount/o.fulltime)*100) + "%";
				if(o.lastCount<=0){
					clearInterval(o.time);
					o.end();
				}
			},1000/60);
		},
		end:function(){
			console.log("ゲームオーバー");
		},
		clear:function(){
			console.log("クリア");
		},
		reset:function(){
		}
	};

	var ui = {
		//ステージ表記
		stageNum:function(i){
			i = ("0" + (i+1)).slice(-2);
			dom.stageNum_.id = "num"+i[0];
			dom.stageNum.id = "num"+i[1];
		}
	};

	var itemList = {
		hammer: new THREE.Object3D(),
		block: new THREE.Object3D(),
		base: new THREE.Object3D()
	};
	scene.add(itemList.hammer);
	scene.add(itemList.block);
	scene.add(itemList.base);

	var phyList ={
		hammer:null,
		block:[]
	};


	var materials = {
		base:  new CANNON.Material(),
		block: new CANNON.Material()
	}


	var stageItem = {
		//ハンマー追加
		addHammer:function(){
			var hammer = new THREE.Object3D();
			//ハンマーヘッド
			var geometry = new THREE.CylinderBufferGeometry( 0.35, 0.35, 2, 27 );
			var material = new THREE.MeshToonMaterial({ color: 0x333333 } );
			var cube = new THREE.Mesh( geometry, material );
			cube.rotation.set(0,0,1.6);
			hammer.add( cube );
			//柄
			var geometry = new THREE.BoxBufferGeometry( 0.2, 0.2, 5 );
			var material = new THREE.MeshLambertMaterial( {color: 0xf9ba82, wireframe:false} );
			var cube = new THREE.Mesh( geometry, material );
			cube.position.set(0,0,2);
			hammer.add( cube );
			//当たり判定
			//var sphereShape = new CANNON.Cylinder(0.12,0.12,1,27);
			var sphereShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 0.5));
			phyList.hammer = new CANNON.Body({mass:0, shape: sphereShape});
			phyList.hammer.position.set(0,0,-5);
			world.add(phyList.hammer);
			phyList.hammer.addEventListener("collide", function(e) {
				console.log(e);
			});
			hammer.position.set(0,1.3,10);
			hammer.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, -5 ) );
			itemList.hammer.add(hammer);
			itemList.hammer.rotation.y = 30*(Math.PI/180);
			itemList.hammer.position.set(0,1.3,5.5);


		},
		//ブロック追加
		addBlock:function(i){
			var geometry = new THREE.CylinderBufferGeometry( 1, 1, 1, 27 );
			var material = new THREE.MeshToonMaterial({
				//map:new THREE.TextureLoader().load( "images/darumap.png" ),
				color: 0xff0000
			});
			var between = 1.4;
			var cylinder = new THREE.Mesh( geometry, material );
			cylinder.position.set(0,(i+1)*between,0);
			cylinder.castShadow = true;
			itemList.block.add(cylinder);
			//
			//var sphereShape = new CANNON.Cylinder(0.5,0.5,0.5,27);
			var sphereShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
			phyList.block[i] = new CANNON.Body({mass: 3, material: materials.block, shape: sphereShape});
			phyList.block[i].position.set(0,(i+1)*between,0);
			phyList.block[i].angularVelocity.set(0, 0, 0);
			phyList.block[i].linearDamping = 0.01;
			phyList.block[i].angularDamping = 1;
			world.add(phyList.block[i]);

		},
		//ベース追加
		addBase:function(){
			var geometry = new THREE.BoxBufferGeometry( 5, 1, 5 );
			var material = new THREE.MeshLambertMaterial( {color: 0xffffff, wireframe:false} );
			var cube = new THREE.Mesh( geometry, material );
			cube.castShadow = true;
			cube.receiveShadow = true;
			itemList.base.add(cube);

			var shape = new CANNON.Box(new CANNON.Vec3(2.5, 0.5, 2.5));
			var phyBox = new CANNON.Body({mass: 0, material:materials.base, shape: shape});
			//phyBox.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
			phyBox.angularDamping = 1;
			world.add(phyBox);
		}
	};


	/*//////////////////////////////////////
	///////////////////////////////////////*/
	function render(){
		requestAnimationFrame(render);
		if(game.isPlay){
			world.step(1/60);
			//console.log(itemList.block.children.length);
			for(var i = 0;i<itemList.block.children.length;i++){
				//console.log(itemList.block.children[i]);
				itemList.block.children[i].position.copy(phyList.block[i].position);
				itemList.block.children[i].quaternion.copy(phyList.block[i].quaternion);
			}
			itemList.hammer.children[0].position.copy(phyList.hammer.position);
			itemList.hammer.children[0].quaternion.copy(phyList.hammer.quaternion);

			effect.render(scene,camera);
		}
	}
	render();

}());