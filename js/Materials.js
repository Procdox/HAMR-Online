class Material{
	constructor(){
		this.editor = new THREE.MeshPhongMaterial({color: 0x6B6964})
		this.export = "tools/toolsnodraw"
}
}

var Mat_Blue_Floor = new Material()
Mat_Blue_Floor.export = "dev/graygrid"

var Mat_Blu_Wall = new Material()
Mat_Blu_Wall.editor = new THREE.MeshPhongMaterial({color: 0x445A77})
Mat_Blu_Wall.export = "dev/reflectivity_40"

var Mat_Blu_Detail = new Material()
Mat_Blu_Detail.editor = new THREE.MeshPhongMaterial({color: 0x7B7974})
Mat_Blu_Detail.export = "dev/reflectivity_50"

var Mat_Ground = new Material()
Mat_Ground.editor = new THREE.MeshPhongMaterial({color: 0x6B8A64})
Mat_Ground.export = "dev/reflectivity_30"

var Mat_Playerclip = new Material()
Mat_Playerclip.editor = new THREE.MeshPhongMaterial({color: 0x8B4684})
Mat_Playerclip.export = "tools/PlayerClip"

var Mat_Skybox = new Material()
Mat_Skybox.editor = new THREE.MeshPhongMaterial({color: 0xBCF0F3})
Mat_Skybox.export = "tools/toolsskybox"

var Mat_Nodraw = new Material()
