
class Model{

	

	getClientDataFor(player){
		if (typeof this.clientFacingFields === 'undefined'){
			console.log('sdfsdadsfsdf');
		}
		var fieldsToSendToClient = this.clientFacingFields || [];
		var returnObject = {};
		for (var i in fieldsToSendToClient){
			var field = fieldsToSendToClient[i];
			var val = this[field];
			if (typeof val === 'object'){
				returnObject[field] = val.getClientDataFor(player);
			}
			else{
				returnObject[field] = val;
			}
		}
		return returnObject;
	}
}


module.exports = Model;