(function() {
	var eventProviders = {
		onGetFire: function() {},
		onPutFire: function() {},
		onUpdateFire: function() {},
		onRemoveFire: function() {}
	};
	var isJSON = function(string) {
		try {
			JSON.parse(string);
		} catch(e) {
			return false;
		}
		return true;
	}
	var isObject = function(data) {
		return (typeof data === "object") ? true : false;
	}
	var getData = function(key) {
		return localStorage.getItem(key);
	}

	function nyanStorage() {
	}
	nyanStorage.prototype.isAvailable = function(key) {
		return (localStorage.getItem(key) == null) ? false : true;
	}
	nyanStorage.prototype.get = function(key) {
		// Fire event
		eventProviders.onGetFire();

		var data = getData(key)

		if (isJSON(data)) {
			return JSON.parse(data);
		} else {
			return data;
		}
	}
	nyanStorage.prototype.put = function(key, data) {
		// Fire event
		eventProviders.onPutFire({key: key, data: data});

		var content;
		
		if (isObject(data)) {
			content = JSON.stringify(data);
		} else {
			content = data;
		}

		localStorage.setItem(key, content);
	}
	nyanStorage.prototype.push = function(key, data) {
		var isAvailable = (localStorage.getItem(key) == null) ? false : true;

		if (isAvailable) {
			var datas = JSON.parse(localStorage.getItem(key));
			datas.push(data);
			localStorage.setItem(key, JSON.stringify(datas));
		} else {
			var content = [data];

			localStorage.setItem(key, JSON.stringify(content));
		}
	}
	nyanStorage.prototype.increment = function(key, numb) {
		var isAvailable = (localStorage.getItem(key) == null) ? false : true;

		if (isAvailable) {
			localStorage.setItem(key, ((localStorage.getItem(key) * 1) + numb));
		} else {
			localStorage.setItem(key, 1);
		}
	};
	nyanStorage.prototype.updateItem = function(key, data) {
		var isAvailable = (localStorage.getItem(key) == null) ? false : true;

		if (isAvailable) {
			localStorage.setItem(key, data);
		} else {
			localStorage.setItem(key, data);
		}
	};
	nyanStorage.prototype.update = function(key, options, data) {
		var isAvailable = (localStorage.getItem(key) == null) ? false : true;

		if (isAvailable) {
			var datas = JSON.parse(localStorage.getItem(key));
			var isEdited = false;
			datas.forEach(function(dataQ, $index) {
				if (dataQ[options.uniq] == data[options.uniq]) {
					isEdited = true;
					options.update.forEach(function(updatedValue) {
						datas[$index][options.update] = data[updatedValue]; 
					});
				}
			});
			if (!isEdited) {
				datas.push(data);
			}
			localStorage.setItem(key, JSON.stringify(datas));
		} else {
			var content = [data];

			localStorage.setItem(key, JSON.stringify(content));
		}
	}
	nyanStorage.prototype.remove = function(key) {
		localStorage.removeItem(key);
	}
	nyanStorage.prototype.getAll = function() {
		var allData = localStorage,
			objectS = {},
			data,
			content;

		if (isObject(allData)) {
			for (var property in allData) {
				if (!allData.hasOwnProperty(property)) continue;
				data = allData[property];

				if (isJSON(data)) {
					content = JSON.parse(data);
				} else {
					content = data;
				}

				objectS[property] = content;
			}

			return objectS;
		} else {
			throw new Error("localStorage not supported");
		}
	}
	nyanStorage.prototype.clear = function(options) {
		if (typeof options == "object") {
			
		}

		return localStorage.clear();
	}
	nyanStorage.prototype.on = function(eventName, eventCallback) {
		switch(eventName) {
			case 'getItem':
				eventProviders.onGetFire = eventCallback;
				break;
			case 'putItem':
				eventProviders.onPutFire = eventCallback;
				break;
			case 'updateItem':
				eventProviders.onUpdateFire = eventCallback;
				break;
			case 'removeItem':
				eventProviders.onRemoveFire = eventCallback;
				break;
			default:
				throw new Error('event "' + eventName + "' is undefined");
				break;
		}
	}

	window.nyanStorage = new nyanStorage();
})(window);