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
	var whitelistProperty = [
		'_onCreate',
		'_onUpdate',
		'_onMigrate',
		'_storage',
		'_sign',
		'_version'
	];
	var toValidObject = function(storage) {
		var storagesAll = {};
		var storagesBlack = {};

		for (var property in storage) {
			if (!storage.hasOwnProperty(property)) continue;
			
			var data = storage[property];

			if (isJSON(data)) {
				var content = JSON.parse(data);
			} else {
				var content = data;
			}

			if (whitelistProperty.indexOf(property) < 0) {
				storagesBlack[property] = content;
			}

			storagesAll[property] = content;
		}

		return {
			storages: storagesAll,
			blacklist: storagesBlack
		};
	}
	/**
	 * [_get description]
	 * @return {[type]} [description]
	 */
	var _get = function(options) {
		try {
			var storages = JSON.parse(atob(CryptoJS.AES.decrypt(getData('_storage'), options.salt).toString(CryptoJS.enc.Utf8)));
		} catch(e) {
			throw new Error(e);
		}

	 	return {
	 		storage: storages,
	 		sign: getData('_sign'),
	 		version: getData('_version'),
	 		onCreate: getData('_onCreate'),
	 		onUpdate: getData('_onUpdate'),
	 		onMigrate: getData('_onMigrate')
	 	}
	}
	/**
	 * [_post description]
	 * @param  {[Object]}   options  [description]
	 * @param  {Function} callback [description]
	 * @return {[Function]} [callback]
	 */
	var _post = function(options, callback) {
	 	try {
	 		localStorage.setItem('_onUpdate', Date.now());

	 		var storage = btoa(JSON.stringify(options.storage));
	 		storage = CryptoJS.AES.encrypt(storage, options.salt).toString();

	 		localStorage.setItem('_version', parseInt(options.version) + 1);
	 		localStorage.setItem('_sign', String(CryptoJS.HmacSHA256(storage, options.salt)));
	 		localStorage.setItem('_storage', String(storage));

	 		var event = new CustomEvent('onChange', {
	 			bubbles: true,
	 			detail: options.storage
	 		});
	 		document.dispatchEvent(event);

	 		if (_.isFunction(callback)) {
	 			callback(true);
	 		} else {
	 			return true;
	 		}
	 	} catch(e) {
	 		if (_.isFunction(callback)) {
	 			callback(false, e);
	 		} else {
	 			throw new Error(e)
	 		}
	 	}
	}
	var _migrate = function(options, callback) {
	 	try {
	 		var getAllItem = toValidObject(localStorage);

	 		if (_.isUndefined(getAllItem.storages._onCreate)) {
	 			localStorage.setItem('_onCreate', Date.now());
	 		}
	 			
	 		getAllItem = getAllItem.blacklist;

	 		localStorage.setItem('_onUpdate', Date.now());
	 		localStorage.setItem('_onMigrate', Date.now());

	 		var storage = btoa(JSON.stringify(getAllItem));

	 		storage = CryptoJS.AES.encrypt(storage, options.salt).toString();

	 		localStorage.setItem('_version', 1);
	 		localStorage.setItem('_sign', String(CryptoJS.HmacSHA256(storage, options.salt)));
	 		localStorage.setItem('_storage', String(storage));

	 		/**
	 		 * Remove item left after migrate
	 		 */
	 		Object.keys(getAllItem).forEach(function(key) {
	 			localStorage.removeItem(key);
	 		})

	 		if (_.isFunction(callback)) {
	 			callback(true);
	 		} else {
	 			return true;
	 		}
	 	} catch(e) {
	 		if (_.isFunction(callback)) {
	 			callback(false, e);
	 		} else {
	 			throw new Error(e)
	 		}
	 	}
	}

	var _ = {
		isNull: function(obj) {
			return obj === null;
		},
		isUndefined: function(obj) {
			return obj === void 0;
		},
		isObject: function(obj) {
			var type = typeof obj;
			return type === 'function' || type === 'object' && !!obj;
		},
		isArray: function(obj) {
			return toString.call(obj) === '[object Array]';
		},
		isFunction: function(obj) {
	    	return typeof obj == 'function' || false;
	    } 
	}
	var getData = function(key) {
		
		return localStorage.getItem(key);
	}

	function nyanStorage(salt) {
		this._salt = salt;	
		this._engine = 'local';
	}

	nyanStorage.prototype.set = function(key, value) {
		var locals = _get({
			salt: this._salt
		})

		switch (key) {
			case 'salt':
				this._salt = value
				break;
			case 'engine':
				this._engine = value
				break;
			default:
				throw new Error('No options for ' + key)
				break;
		}

		return _post({
			salt: this._salt,
			storage: locals.storage,
			version: locals.version
		})
	}
	nyanStorage.prototype.getSecure = function() {
		
		return _get({
			salt: this._salt
		});
	}
	nyanStorage.prototype.doMigrate = function() {
		_migrate({
			salt: this._salt
		}, function(status, e) {
			
		});
	}
	nyanStorage.prototype.isAvailable = function(key) {
		var locals = _get({
			salt: this._salt
		})

		return (locals.storage[key]) ? true : false;	

	}
	nyanStorage.prototype.get = function(key) {
		// Fire event
		eventProviders.onGetFire();

		var locals = _get({
			salt: this._salt
		})

		return locals.storage[key];	
	}
	nyanStorage.prototype.put = function(key, data) {
		// Fire event
		eventProviders.onPutFire({key: key, data: data});

		var content = null;
		var locals = _get({
			salt: this._salt
		});

		locals.storage[key] = data;

		_post({
			storage: locals.storage,
			version: locals.version,
			salt: this._salt
		})
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
		var content = null;
		var locals = _get({
			salt: this._salt
		});

		if (typeof numb !== "number") {
			throw new Error('increment value not number')
		}

		if (locals.storage[key]) {
			locals.storage[key] += numb;

			_post({
				storage: locals.storage,
				version: locals.version,
				salt: this._salt
			})
		} else {
			locals.storage[key] = numb;

			_post({
				storage: locals.storage,
				version: locals.version,
				salt: this._salt
			})
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
	/**
	 * Update value from Array with unique #ID
	 * @param  {[String]} key     Key storage
	 * @param  {[Object]} data    Value wont to push on storage 
	 * @return {[Boolean]}        Result from write on local storage
	 */
	nyanStorage.prototype.push = function(key, data) {
		var locals = _get({
			salt: this._salt
		})
		var values = locals.storage[key];

		if (!_.isUndefined(values)) {
			if (_.isArray(values)) {
				locals.storage[key].push(data);	
			} 
		} else {
			locals.storage[key] = [];
			locals.storage[key].push(data);
		}

		return _post({
			salt: this._salt,
			storage: locals.storage,
			version: locals.version
		})
	}
	nyanStorage.prototype.remove = function(key) {
		var locals = _get({
			salt: this._salt
		})

		delete locals.storage[key];

		_post({
			storage: locals.storage,
			salt: this._salt,
			version: locals.version
		})
	}
	nyanStorage.prototype.getAll = function() {
		return _get({
			salt: this._salt
		})
	}
	nyanStorage.prototype.clear = function(options) {
		if (typeof options == "object") {
			
		} else {
			return localStorage.clear();
		}
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

	window.nyanStorage = nyanStorage
})(window);