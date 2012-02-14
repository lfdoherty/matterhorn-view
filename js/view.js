
//#requires renderers fastevent

/*

Todo implement view update batching.

*/

View = {};


(function(){

var blocked = false;

disableViewRefresh = function(){blocked = true;}
enableViewRefresh = function(){blocked = false;}

var rendering = false;

function renderView(model, domId, f, isSubmodel, okToRefresh, dontBubble){
	_.assertDefined(model);
	_.assertString(domId);

	var hb = false;
	
	var myOkToRefresh = {hasBegun: hasBegun, children: {}}

	function hasBegun(){
		hb = true;
		if(okToRefresh) okToRefresh.hasBegun();
	}
	
	function finishRefresh(){hb = false;}
	
	function beforeRefresh(isSource){
		if(!hb){
			if(dontBubble){
				hasBegun();
				console.log('before refresh on ' + domId);
				return afterRefresh;
			}else{
				if(!isSubmodel) return afterRefresh;
			}
		}
		return finishRefresh;
	}

	if(okToRefresh) okToRefresh.children[domId] = function(){
		if(!_.isFunction(model) && !_.isPrimitive(model)){
			console.log('removed child listener: ' + domId);
			model.removeListener('view_renderer_' + domId, beforeRefresh);
		}		
	}
	
	if(!_.isFunction(model) && !_.isPrimitive(model)){
		model.listenForRefresh('view_renderer_' + domId, beforeRefresh);
	}

	var handle = {};

	function refresh(isRenderingSuperModel){
	
		_.each(myOkToRefresh.children, function(removeFunction, childDomId){
			removeFunction();
		});
		myOkToRefresh.children = {};

		function cb(subModel, subDomId, subF, dontBubble){
			//_.assertLength(arguments, 3);
			_.assertFunction(subF);
			//_.assertObject(subModel);
			//_.assertString(subDomId);
			_.assertPrimitive(subDomId);
			return renderView(subModel, domId + subDomId, subF, true, myOkToRefresh, dontBubble);
		}
		
		cb.fullId = function(subDomId){
			if(arguments.length === 0) subDomId = '';
			else _.assertDefined(subDomId);
			return domId + subDomId;
		}
		cb.refresh = function(){
			//console.log('view refreshing via rr.refresh');
			refresh(false);
			
		}
		
		cb.property = function(propertyName, subF, dontBubble){
			_.assertString(propertyName);
			_.assertFunction(subF);
			var subModel = model.property(propertyName);
			_.assertDefined(subModel);
			return renderView(subModel, domId + propertyName, subF, true, myOkToRefresh, dontBubble);
		}
		cb.propertyDiv = function(propertyName, subF, classStrings, dontBubble){
			_.assertString(propertyName);
			_.assertFunction(subF);
			var subModel = model.property(propertyName);
			_.assertDefined(subModel);
			var subDomId = domId + propertyName;
			return '<div id="' + domId + '">' +
				renderView(subModel, subDomId, subF, true, myOkToRefresh, dontBubble) +
				'</div>';
		}
		cb.propertySpan = function(propertyName, subF, classStrings, dontBubble){
			_.assertString(propertyName);
			_.assertFunction(subF);
			var subModel = model.property(propertyName);
			_.assertDefined(subModel);
			var subDomId = domId + propertyName;
			return '<span id="' + domId + '">' +
				renderView(subModel, subDomId, subF, true, myOkToRefresh, dontBubble) +
				'</span>';
		}
		var html = f(_.isFunction(model) ? model() : model, cb);
		
		_.assertString(html);
		
		if(isRenderingSuperModel){
			return html;
		}else{
			var domContainer = $('#' + domId);
			var container = domContainer;
			_.assertLength(domContainer, 1);

			rendering = true;
			container.html(html);
			rendering = false;
		}
	}
	
	function afterRefresh(){
		if(!blocked){
			refresh();
			console.log('done refresh on ' + domId);
		}
		hb = false;
	}
	
	return refresh(isSubmodel);
}

View.isRendering = function(){
	return rendering;
}

View.render = function(model, domId, f){
	
	return renderView(model, domId, f, false);
}


})();
