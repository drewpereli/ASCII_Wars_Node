
class Model{

	constructor(args){
		Object.assign(this, args);
	}

	getClientDataFor(player){
		if (typeof this.clientFacingFields === 'undefined'){
			console.log('sdfsdadsfsdf');
		}
		var fieldsToSendToClient = this.clientFacingFields || [];
		var returnObject = {};
		for (var i in fieldsToSendToClient){
			var field = fieldsToSendToClient[i];
			var val = this[field];
			if (typeof val === 'object' && !!val){
				if ('getClientDataFor' in val)
					returnObject[field] = val.getClientDataFor(player);
				else
					returnObject[field] = val;
			}
			else{
				returnObject[field] = val;
			}
		}
		return returnObject;
	}
}


module.exports = Model;