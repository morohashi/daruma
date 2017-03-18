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
	world.gravity.set(0, -9.82, 0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;
	world.solver.tolerance = 0.1;

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
		lastCount:0,
		fulltime:0,
		play:function(i){
			this.lastCount = stage[i].lasttime * 60;
			this.fulltime =  this.lastCount;
			//ベース
			stageItem.addBase();
			//
			stageItem.addHammer();
			//block
			for(var v=0; v<stage[i].block; v++){
				stageItem.addBlock(v);
			}
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
			i = ("0" + i).slice(-2);
			dom.stageNum_.id = "num0";
			dom.stageNum.id = "num1";
		}
	};

	var itemLst = {
		hammer: new THREE.Object3D(),
		block: new THREE.Object3D(),
		base: new THREE.Object3D()
	};
	scene.add(itemLst.hammer);
	scene.add(itemLst.block);
	scene.add(itemLst.base);

	var stageItem = {
		//ハンマー追加
		addHammer:function(){
			var hammer = new THREE.Object3D();
			var geometry = new THREE.CylinderBufferGeometry( 0.35, 0.35, 2, 27 );
			var material = new THREE.MeshToonMaterial({
				color: 0x333333
			} );
			var cube = new THREE.Mesh( geometry, material );
			cube.rotation.set(0,0,1.6);
			hammer.add( cube );
			var geometry = new THREE.BoxBufferGeometry( 0.2, 0.2, 5 );
			var material = new THREE.MeshLambertMaterial( {color: 0x333333, wireframe:false} );
			var cube = new THREE.Mesh( geometry, material );
			cube.position.set(0,0,2);
			hammer.add( cube );
			hammer.position.set(0,1.3,0);
			hammer.rotation.set(0,0,0);
			itemLst.hammer.add(hammer);
		},
		//ブロック追加
		addBlock:function(i){
			var geometry = new THREE.CylinderBufferGeometry( 1, 1, 1, 27 );
			var material = new THREE.MeshToonMaterial({
				color: 0xff0000
			} );
			var cylinder = new THREE.Mesh( geometry, material );
			cylinder.position.set(0,(i+1)*1.2,0);
			cylinder.castShadow = true;
			itemLst.block.add(cylinder);
		},
		//ベース追加
		addBase:function(){
			var geometry = new THREE.BoxBufferGeometry( 5, 1, 5 );
			var material = new THREE.MeshLambertMaterial( {color: 0xffffff, wireframe:false} );
			var cube = new THREE.Mesh( geometry, material );
			cube.castShadow = true;
			cube.receiveShadow = true;
			itemLst.base.add(cube);

			var shape = new CANNON.Box(new CANNON.Vec3(5, 1, 5));
			var phyBox = new CANNON.Body();
			phyBox.angularDamping = 0.1;
			world.add(phyBox);
		}
	};


	/*//////////////////////////////////////
	///////////////////////////////////////*/
	function render(){
		requestAnimationFrame(render);
		if(game.isPlay){
			world.step(1/60);
			effect.render(scene,camera);


			//itemLst.hammer.rotation.y += 0.1;
			var q = new THREE.Quaternion();
			q.setFromAxisAngle(new THREE.Vector3(0, 5, 0).normalize(), 0.1);
			q.multiply(itemLst.hammer.quaternion.clone());
			itemLst.hammer.quaternion.copy(q);
		}
	}
	render();

}());