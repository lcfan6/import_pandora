// module = [{
//     src: 'jquery.min.js',
//     exports: jQuery,
//     loaded: false,
//     deps: [{
//         src: 'jquery.min.js',
//         exports: jQuery,
//         loaded: false
//     }]
// }];
// define(['http://a.com/jquery.min.js'], function (a) {
//     return {};
// });

// require(['a.com'], function (b) {
//     return {};
// });

(function (env, factory) {
    env.define = factory(env).define;
    env.require = factory(env).require;
})(this, function (env) {
    var rootModule = {
        exports: null,
        loaded: true,
        deps: [],
        fn: null,
    };
    rootModule.__proto__ = Module.prototype;
    rootModule.getCurrentModule = function (src) {
        var mod = this;
        return r(mod);

        function r(mod) {
            if (mod.src === src) {
                return mod;
            }
            for (var i = 0; i < mod.deps.length; i++) {
                return r(mod.deps[i]);
            }
            return null;
        }
    }

    function is(o, type) {
        type = type[0].toUpperCase() + type.substr(1);
        var t = {}.toString.call(o);
        return '[object ' + type + ']' === t;
    }

    function define(deps, cb) {
        var src = document.currentScript.src;
        var currentModule = rootModule.getCurrentModule(src);
        if (!currentModule) {
            throw new Error('internal error. You can issue at Github');
        }
        if (!is(deps, 'Array')) {
            deps = [deps];
        }
        if (cb === undefined) {
            cb = deps;
            deps = [];
        }
        if (typeof cb !== 'function') {
            throw new Error('nust have a callback function');
        }
        if (!deps.length) {
            currentModule.exports = cb();
            return
        }
        deps.forEach(function (src) {
            currentModule.addDeps(src);
        });
        currentModule.load();
    }

    function require(deps, cb) {
        if (!is(deps, 'Array')) {
            deps = [deps];
        }
        if (cb === undefined) {
            cb = deps;
            deps = [];
        }
        if (typeof cb !== 'function') {
            throw new Error('must have a callback function');
        }
        if (!deps.length) {
            cb()
            return;
        }
        deps.forEach(function (src) {
            rootModule.addDeps(src);
        })
        rootModule.fn = cb;
        rootModule.load();
    }

    function Module(src) {
        if (env === this) {
            return new Module();
        }
        var mod = this;
        mod.src = src;
        mod.deps = [];
        mod.exports = null;
        mod.loaded = false;
        mod.fn = null;
    }


    Module.prototype.addDeps = function (src) {
        var mod = this;
        mod.deps.push(new Module(src));
    }

    Module.prototype.load = function () {
        var mod = this
        if (mod.src && !mod.loaded) {
            var srcElement = document.createElement('script');
            srcElement.src = mod.src;
            srcElement.onload = function () {
                mod.loaded = true;
                if (mod.isLoaded()) {
                    mod.fn.apply(env, mod.deps.map(function (dep) {
                        return dep.exports;
                    }));
                }
            }
        }
        mod.deps.forEach(function (mod) {
            mod.load();
        })

    }

    Module.prototype.load = function (deps, cb) {
        var mod = this;
        var srcElement = document.createElement('script');
        srcElement.src = mod.src;
        srcElement.onload = function () {
            mod.loaded = true;
            if (mod.isLoaded()) {
                deps = deps.map(function (dep) {
                    return dep.exports;
                })
                mod.exports = cb.apply(env, deps)
            }
        }
        document.body.appendChild(srcElement);
    }

    Module.prototype.isLoaded = function () {
        var mod = this;
        try {
            return recursive(mod);
        } catch (err) {
            return false;
        }

        function recursive(mod) {
            mod.deps.forEach(function (mod) {
                recursive(mod);
            });
            if (!mod.loaded) {
                throw new Error('not loaded');
            }
            return true;
        }
    }

    return {
        define: define,
        require: require,
    }
});