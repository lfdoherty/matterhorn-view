
/*

Todo implement view update batching.

*/

View = {};

(function(){

var views = {};

var rendering = false;

var blocked = false;

function renderView(parentView, model, domId, f, isSubmodel){

	var domContainer = $('#' + domId);

	function beforeRefresh(){return afterRefresh;}
	
	var v = {children: {}, container: domContainer, bf: beforeRefresh};
	
	if(views[domId] !== undefined){
		var did = model.removeListener(views[domId].bf);
		if(!did){
			_.errout('error, tried to remove listener and was told it did not exist');
		}
	}
	
	parentView[domId] = v;
	views[domId] = v;
	
	
	model.listen(beforeRefresh);

	var handle = {};

	function refresh(isRenderingSuperModel){

		function cb(subModel, subDomId, subF){
			_.assertLength(arguments, 3);
			return renderView(v.children, subModel, subDomId, subF, true);
		}
		
		var html = f(model, cb);
		
		v.html = html;
		
		if(isRenderingSuperModel){
			return html;
		}else{
			var domContainer = $('#' + domId);
			v.container = domContainer;

			rendering = true;
			v.container.html(html);
			rendering = false;
		}
	}
	
	function afterRefresh(){
		if(!blocked){
			refresh();
		}
	}
	
	return refresh(isSubmodel);
}

View.isRendering = function(){
	return rendering;
}

View.render = function(model, domId, f){
	
	return renderView(views, model, domId, f, false);
}

View.blockRefresh = function(){
	blocked = true;
}
View.unblockRefresh = function(){
	blocked = false;
}

//provides the most recent rendering for the given domId
View.getLastRender = function(domId){
	var v = views[domId];
	if(v === undefined){
		console.log('candidates: ' + JSON.stringify(_.keys(views)));
		_.errout('domId has never been rendered(' + domId + ')');
	}
	return v.html;
}

View.delayRendering = function(){
	//TODO
}
View.resumeRendering = function(){
	//TODO
}

})();
