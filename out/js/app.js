(function(){
	//デバッグ
	isDebug = true;
	//DOM
	var dom = {
		title : document.getElementById("title"),
		shot : document.getElementById("shot"),
		game: document.getElementById("game"),
		gauge : document.getElementById("gauge"),
		stageNum_ : document.querySelector(".num10"),
		stageNum : document.querySelector(".num01"),
		gameover:document.querySelector(".gameover"),
		clear:document.querySelector(".clear")
	};

	//ローディング
	document.body.classList.add("loaded");
	//タイトル画面
	dom.title.addEventListener('touchstart',function(e){
		document.body.classList.add("titleend");
		game.play(0);
	});
	//クリア画面
	dom.clear.addEventListener('touchstart',function(e){
		document.body.classList.remove("status-clear");
		game.play(game.stageIndex);
	});

	//ゲームオーバー画面
	dom.gameover.addEventListener('touchstart',function(e){
		location.href = "./";
	});
	//打ボタン設定
	var ct = 0;
	var maxPower = 200;
	dom.shot.addEventListener('touchstart',function(e){
		if(!game.hammerAnimation){
			ct = 0;
			setInterval(function(){
				ct++;
				if(ct>=maxPower){
					ct = maxPower;
				}
			},1000/60);
		}
	});

	dom.shot.addEventListener('touchend',function(e){
		if(game.isPlay && !game.hammerAnimation){
			for(var i=0;i<phyList.block.length;i++){
				phyList.block[i].angularDamping = 0.1;
			}
			var power = ct/maxPower;
			game.hammerAnimation = true;
			var tm = new TimelineMax({
				yoyo:true,
				repeat:1,
				onComplete:function(){
					game.hammerAnimation = false;
				}
			});
			tm.to(itemList.hammer.position,0.2,{
				x:1.5,
				onUpdate:function(){
					phyList.hammer.position.copy(itemList.hammer.position);
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
	world.gravity.set(0, -10, 0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;
	world.solver.tolerance = 0.1;
	world.defaultContactMaterial.contactEquationStiffness = 5e6;
	world.defaultContactMaterial.contactEquationRelaxation = 3;
	var mass = 1;
	//
	var cannonDebugRenderer = new THREE.CannonDebugRenderer( scene, world );
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
		},
		{
			lasttime : 10,
			block : 15
		},
		{
			lasttime : 10,
			block : 25
		},
		{
			lasttime : 10,
			block : 35
		},
		{
			lasttime : 10,
			block : 45
		},
		{
			lasttime : 10,
			block : 55
		}


	];

	var game = {
		time:null,
		isPlay:false,
		isClear:false,
		hammerAnimation:false,
		stageIndex:0,
		lastCount:0,
		fulltime:0,
		blockCount:0,
		pushBlockCount:0,
		play:function(i){
			this.pushBlockCount = 0;
			this.lastCount = stage[i].lasttime * 60;
			this.fulltime =  this.lastCount;
			this.isClear = false;
			//ベース
			if(itemList.base.children.length==0){
				stageItem.addBase();
			}
			//ハンマー
			if(itemList.hammer.children.length==0){
				stageItem.addHammer();
			}
			//block
			if(itemList.block.children.length != 0){
				scene.remove(itemList.block);
				for(var v =0;v<phyList.block.length;v++){
					world.remove(phyList.block[v]);
				}
				itemList.block = new THREE.Object3D();
				scene.add(itemList.block);
			}
			console.log(stage[i].block);
			for(var v=0; v<stage[i].block; v++){
				if(v==stage[i].block-1){
					stageItem.addHeadBlock(v);
				}else{
					stageItem.addBlock(v);
				}
			}
			this.blockCount = stage[i].block;
			var mat = new CANNON.ContactMaterial(materials.base, materials.block, { friction: 0.01, restitution: 0.00000001});
			world.addContactMaterial(mat);
			var mat2 = new CANNON.ContactMaterial(materials.block, materials.block, { friction: 0.00000001, restitution: 0.0});
			world.addContactMaterial(mat2);
			var mat3 = new CANNON.ContactMaterial(materials.hammer, materials.block, { friction: 10.0, restitution: 0.0, frictionEquationRelaxation:0, contactEquationRelaxation:0 });
			world.addContactMaterial(mat3);
			//UI初期化
			ui.stageNum(i);
			var o = this;
			o.isPlay = true;
			setTimeout(function(){
				o.update();
			},1000);
		},
		update:function(){
			return;
			var o = this;
			this.time = setInterval(function(){
				o.lastCount--;
				dom.gauge.style.width = 100 - ((o.lastCount/o.fulltime)*100) + "%";
				if(o.lastCount<=0){
					clearInterval(o.time);
					o.end();
				}
				if(o.isClear){
					clearInterval(o.time);
				}
			},1000/60);
		},
		push:function(){
			var o = this;
			setTimeout(function(){
				phyList.block[o.pushBlockCount].applyImpulse(new CANNON.Vec3(-150, 0, -150), phyList.block[o.pushBlockCount].position);
				o.pushBlockCount++;
				if(o.pushBlockCount >= o.blockCount){
					o.clear();
				}
			},50);
		},
		end:function(){
			console.log("ゲームオーバー");
			document.body.classList.add("status-gameover");
		},
		clear:function(){
			console.log("クリア");
			this.isClear = true;
			document.body.classList.add("status-clear");
			this.stageIndex++;

			if(stage.length <= this.stageIndex){
				this.stageIndex = 0;
			}
			console.log(this.stageIndex);
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
		block: new CANNON.Material(),
		hammer: new CANNON.Material()
	}


	var stageItem = {
		//ハンマー追加
		addHammer:function(){
			var hammer = new THREE.Object3D();
			//ハンマーヘッド
			var geometry = new THREE.CylinderBufferGeometry( 0.35, 0.35, 2, 27 );
			var material = new THREE.MeshToonMaterial({ color: 0x333333 } );
			var head = new THREE.Mesh( geometry, material );
			head.rotation.z = 90*(Math.PI/180);
			head.position.set(0,0,-2.5);
			hammer.add( head );
			//柄
			var geometry = new THREE.BoxBufferGeometry( 0.2, 0.2, 5 );
			var material = new THREE.MeshLambertMaterial( {color: 0xf9ba82, wireframe:false} );
			var cube = new THREE.Mesh( geometry, material );
			cube.position.set(0,0,0);
			hammer.add( cube );
			itemList.hammer.add(hammer);
			itemList.hammer.position.set(3,1,2.4);

			//当たり判定
			var sphereShape = new CANNON.Box(new CANNON.Vec3(1.0,0.2, 2.8));
			phyList.hammer = new CANNON.Body({mass:0, material: materials.hammer ,shape: sphereShape});
			phyList.hammer.position.copy(itemList.hammer.position);
			phyList.hammer.quaternion.copy(itemList.hammer.quaternion);
			world.add(phyList.hammer);
		},
		//ブロック追加
		addBlock:function(i){
			var geometry = new THREE.CylinderBufferGeometry( 1, 1, 1, 27 );
			var material = new THREE.MeshToonMaterial({
				color: 0xff0000
			});
			var between = 1.4;
			var cylinder = new THREE.Mesh( geometry, material );
			cylinder.position.set(0,(i+1)*between,0);
			cylinder.castShadow = true;
			itemList.block.add(cylinder);
			//
			//var sphereShape = new CANNON.Cylinder(0.8,0.8,1,27);
			var sphereShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 1));
			phyList.block[i] = new CANNON.Body({mass: 100, material: materials.block, shape: sphereShape});
			phyList.block[i].position.copy(cylinder.position);
			//phyList.block[i].angularVelocity.set(0, 0, 0);
			//phyList.block[i].quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
			phyList.block[i].linearDamping = 0.01;
			phyList.block[i].angularDamping = 1;
			world.add(phyList.block[i]);
		},
		addHeadBlock:function(i){
			var geometry = new THREE.CylinderBufferGeometry( 1, 1, 1, 27 );
			var material = new THREE.MeshToonMaterial({
				color: 0x000000
			});
			var between = 1.4;
			var cylinder = new THREE.Mesh( geometry, material );
			cylinder.position.set(0,(i+1)*between,0);
			cylinder.castShadow = true;
			itemList.block.add(cylinder);
			//
			//var sphereShape = new CANNON.Cylinder(0.8,0.8,1,27);
			var sphereShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 1));
			phyList.block[i] = new CANNON.Body({mass: 100, material: materials.block, shape: sphereShape});
			phyList.block[i].position.copy(cylinder.position);
			//phyList.block[i].angularVelocity.set(0, 0, 0);
			//phyList.block[i].quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
			phyList.block[i].linearDamping = 0.01;
			phyList.block[i].angularDamping = 1;
			world.add(phyList.block[i]);
			phyList.block[i]..addEventListener("collide", function(e) {
				if(e.contact.bi.name == "base"){
					bakuCollideText();
					d.bakuBody.isAnimation = false;
				}
			});
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
			phyBox.name = "base";
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
			//itemList.hammer.children[0].children[0].position.copy(phyList.hammer.position);
			//itemList.hammer.children[0].children[0].quaternion.copy(phyList.hammer.quaternion);
			if(isDebug){
				cannonDebugRenderer.update();
			}
			effect.render(scene,camera);
		}
	}
	render();

}());
(function(win, doc) {
    "use strict";
    var tapFlag = false,
        timer;
    doc.body.addEventListener("touchstart", function(evt) {
        if (tapFlag) {
            //evt.preventDefault();
        }
    }, true);
    doc.body.addEventListener("touchend", function(evt) {
        tapFlag = true;
        clearTimeout(timer);
        timer = setTimeout(function() {
            tapFlag = false;
        }, 200); // 100だと短い、150だとやや短い
    }, true);
})(window, document);