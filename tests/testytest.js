var TestyTest = (function () {
    function TestyTest(category) {
        this._Id = Guid();
        this._Category = category;
        this._Elements = {
            Root: undefined,
            Data: undefined,
            TestsRoot: undefined,
            Tests: {}
        };
        this._Data = {
            Total: 0,
            Pending: 0,
            Passed: 0,
            Failed: 0
        };
        this._Elements.Root = document.createElement('div');
        this._Elements.Root.id = "testy-test-" + this._Id;
        this._Elements.Root.innerHTML = '<h1 class="category-title">' + this._Category + '</h1>' +
            '<div id="' + this._Id + '-testy-data">' +
            '<span id="' + this._Id + '-total">0</span> total, ' +
            '<span id="' + this._Id + '-pending">0</span> pending, ' +
            '<span id="' + this._Id + '-passed">0</span> passed, ' +
            '<span id="' + this._Id + '-failed">0</span> failed' +
            '</div>' +
            '<div id="' + this._Id + '-testy-tests">' +
            '</div>';
        document.body.appendChild(this._Elements.Root);
        this._Elements.TestsRoot = document.getElementById(this._Id + '-testy-tests');
        this._Elements.Data = {
            Total: document.getElementById(this._Id + '-total'),
            Pending: document.getElementById(this._Id + '-pending'),
            Passed: document.getElementById(this._Id + '-passed'),
            Failed: document.getElementById(this._Id + '-failed')
        };
        document.body.insertAdjacentHTML('beforeend', '<style>' +
            '.category-title { font-size: 35px; margin-bottom: 0px; }' +
            'div[id$="-testy-data"] { font-family: Consolas, monospace; margin-bottom: 15px; }' +
            'div[id$="-testy-tests"] { font-family: Consolas, monospace; padding-left: 20px; }' +
            'div[id$="-test-title"] { display: inline-block; margin-right: 10px; width: 300px; word-wrap: break-word; text-align: right; }' +
            '.test-passed { color: #02B71E; } .test-failed, .test-timedout { color: #FF0000; }' +
            'div[id$="-test-container"] { margin-top: 5px; }' +
            'body { background: #e9e7e7; color: #373a3c }' +
            '</style>');
    }
    TestyTest.prototype.UpdateTest = function (id, result, timedOut) {
        if (timedOut == undefined)
            timedOut = false;
        if (result == undefined)
            result = false;
        this._Data.Pending--;
        if (timedOut || !result) {
            this._Data.Failed++;
            this._Elements.Data.Failed.innerHTML = this._Data.Failed.toString();
        }
        else {
            this._Data.Passed++;
            this._Elements.Data.Passed.innerHTML = this._Data.Passed.toString();
        }
        this._Elements.Tests[id].innerHTML = (timedOut) ? 'Timed Out' : (result) ? 'Passed' : 'Failed';
        this._Elements.Tests[id].classList.add('test-' + ((timedOut) ? 'timedout' : (result) ? 'passed' : 'failed'));
        this._Elements.Data.Pending.innerHTML = this._Data.Pending.toString();
    };
    TestyTest.prototype.HandleError = function (id, result) {
        this.UpdateTest(id, false);
        this._Elements.Tests[id].innerHTML = result.toString();
    };
    TestyTest.prototype.AddTest = function (name, test, timeout) {
        var _this = this;
        if (timeout == undefined)
            timeout = 120;
        this._Data.Total++;
        this._Elements.Data.Total.innerHTML = this._Data.Total.toString();
        this._Data.Pending++;
        this._Elements.Data.Pending.innerHTML = this._Data.Pending.toString();
        var id = Guid();
        var el = document.createElement('div');
        el.id = id + '-test-container';
        el.innerHTML = '<div id="' + id + '-test-title">' + name + ':</div> <span id="' + id + '-test-results">Pending</span>';
        this._Elements.TestsRoot.appendChild(el);
        this._Elements.Tests[id] = document.getElementById(id + '-test-results');
        var timerId = window.setTimeout(function () {
            _this.UpdateTest(id, false, true);
        }, timeout * 1000);
        window.setTimeout(function () {
            try {
                var asserted = false;
                test(function (result) {
                    if (asserted) return;
                    asserted = true;
                    window.clearTimeout(timerId);
                    _this.UpdateTest(id, result);
                });
            }
            catch (e) {
                _this.HandleError(id, e);
            }
        }, 0);
    };
    return TestyTest;
}());
function Guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
}
