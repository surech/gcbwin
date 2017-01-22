var IMAGE_HEIGHT = 80;
var IMAGE_TOP_MARGIN = 10;
var IMAGE_BOTTOM_MARGIN = 10;
var SLOT_SEPARATOR_HEIGHT = 0;
var SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN + SLOT_SEPARATOR_HEIGHT; // how many pixels one slot image takes
var RUNTIME = 3000; // how long all slots spin before starting countdown
var SPINTIME = 1000; // how long each slot spins at minimum
var ITEM_COUNT = 9 // item count in slots
var SLOT_SPEED = 20; // how many pixels per second slots roll
var DRAW_OFFSET = 80 // how much draw offset in slot display from top

var BLURB_TBL = [
    'No win!',
    'Good!',
    'Excellent!',
    'WINNER!'
];

function shuffleArray(array) {

    for (i = array.length - 1; i > 0; i--) {
        var j = parseInt(Math.random() * i)
        var tmp = array[i];
        array[i] = array[j]
        array[j] = tmp;
    }
}

// Images must be preloaded before they are used to draw into canvas
function preloadImages(images, callback) {

    function _preload(asset) {
        asset.img = new Image();
        asset.img.src = 'images/icons/' + IMAGE_HEIGHT + '/' + asset.id + '.png';

        asset.img.addEventListener("load", function () {
            _check();
        }, false);

        asset.img.addEventListener("error", function (err) {
            _check(err, asset.id);
        }, false);
    }

    var loadc = 0;

    function _check(err, id) {
        if (err) {
            alert('Failed to load ' + id);
        }
        loadc++;
        if (images.length == loadc)
            return callback()
    }

    images.forEach(function (asset) {
        _preload(asset);
    });
}

function copyArray(array) {
    var copy = [];
    for (var i = 0; i < array.length; i++) {
        copy.push(array[i]);
    }
    return copy;
}

function SlotGame() {
    console.log("Argumentos");
    console.log(arguments);

    IMAGE_HEIGHT = arguments[3];
    IMAGE_TOP_MARGIN = arguments[4];
    IMAGE_BOTTOM_MARGIN = arguments[5];
    SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN + SLOT_SEPARATOR_HEIGHT;

    $(".canvas").css("padding-left", arguments[6] + "px");
    $(".canvas").css("margin-top", "-" + (IMAGE_TOP_MARGIN * 1.5) + "px");

    console.log("IMAGE_HEIGHT: " + IMAGE_HEIGHT);
    console.log("IMAGE_TOP_MARGIN: " + IMAGE_TOP_MARGIN);
    console.log("IMAGE_BOTTOM_MARGIN: " + IMAGE_BOTTOM_MARGIN);
    console.log("SLOT_HEIGHT: " + SLOT_HEIGHT);

    var game = new Game(arguments);


    var items = [
        {id: 'cherry'},
        {id: 'apple'},
        {id: 'bar'},
        {id: 'kiwi'},
        {id: 'bell'},
        {id: 'orange'},
        {id: 'lemon'},
        {id: 'seven'},
        {id: 'grape'}
    ];

    /*
     * TODO: Get items from Ajax call

     var items = [
     <?php
     $oWinSigns = Spinner_icon_name::get();
     $i = 0;
     $iNbSpinnerIcons = Spinner_icon_name::count();
     $strWinSign = '';

     foreach ($oWinSigns as $oWinSign) {
     $strWinSign .= '(id:' . $oWinSign->name . ')'
     if ($i != $iNbSpinnerIcons) {
     $strWinSign .= ','
     }
     }
     echo $strWinSign;
     ?>
     ];
     */

    $('canvas').attr('height', IMAGE_HEIGHT * ITEM_COUNT * 2);
    $('canvas').css('height', IMAGE_HEIGHT * ITEM_COUNT * 2);

    game.items = items;

    // load assets and predraw the reel canvases
    preloadImages(items, function () {

        // images are preloaded

        // draws canvas strip
        function _fill_canvas(canvas, items) {
            ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ddd';

            for (var i = 0; i < ITEM_COUNT; i++) {
                var asset = items[i];
                ctx.save();
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowOffsetX = 5;
                ctx.shadowOffsetY = 5;
                ctx.shadowBlur = 5;

                ctx.drawImage(asset.img, 3, i * SLOT_HEIGHT + IMAGE_TOP_MARGIN);
                ctx.drawImage(asset.img, 3, (i + ITEM_COUNT) * SLOT_HEIGHT + IMAGE_TOP_MARGIN);

                ctx.restore();
                ctx.fillRect(0, i * SLOT_HEIGHT, 70, SLOT_SEPARATOR_HEIGHT);
                ctx.fillRect(0, (i + ITEM_COUNT) * SLOT_HEIGHT, 70, SLOT_SEPARATOR_HEIGHT);
            }
        }

        // Draw the canvases with shuffled arrays


        game.items1 = copyArray(items);
        game.items2 = copyArray(items);
        game.items3 = copyArray(items);

        //DAB->20161104: Prevent the winSign is in position 1
        if (game.canWin) {
            do {
                shuffleArray(game.items1);
            }
            while (game.items1[1].id == game.winSign);
        } else {
            shuffleArray(game.items1);
        }

        _fill_canvas(game.c1[0], game.items1);

        if (game.canWin) {
            do {
                shuffleArray(game.items2);
            }
            while (game.items2[1].id == game.winSign);
        } else {
            shuffleArray(game.items2);
        }

        _fill_canvas(game.c2[0], game.items2);

        if (game.canWin) {
            do {
                shuffleArray(game.items3);
            }
            while (game.items3[1].id == game.winSign);
        } else {
            shuffleArray(game.items3);
        }

        _fill_canvas(game.c3[0], game.items3);

        game.resetOffset = (ITEM_COUNT + 3) * SLOT_HEIGHT;
        game.loop();
    });

    $('#play').click(function (e) {
        // start game on play button click

        //DAB->20161019: Add disable state for play button
        $(this).prop('disabled', true);
        $(this).addClass('disabled-button');

        game.restart();
    });

    // Show reels for debugging
    var toggleReels = 1;
    $('#debug').click(function () {
        toggleReels = 1 - toggleReels;
        if (toggleReels) {
            $('#reels').css('overflow', 'hidden');
        } else {
            $('#reels').css('overflow', 'visible');
        }
    });
}

function Game() {

    this.canWin = false;
    this.winSpin = 0;
    this.winSign = '';
    this.spinCount = 0;
    this.spinCountMax = 0;
    this.iSpinCountDisp = 0;

    if (arguments != undefined && arguments.length == 1) {
        this.canWin = arguments[0][0] == '1';
        this.winSpin = parseInt(arguments[0][1]);
        this.winSign = arguments[0][2];
        this.spinCountMax = parseInt(arguments[0][7]);
    }

    // reel canvases
    this.c1 = $('#canvas1');
    this.c2 = $('#canvas2');
    this.c3 = $('#canvas3');


    // set random canvas offsets
    this.offset1 = -parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;
    this.offset2 = -parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;
    this.offset3 = -parseInt(Math.random() * ITEM_COUNT) * SLOT_HEIGHT;
    this.speed1 = this.speed2 = this.speed3 = 0;
    this.lastUpdate = new Date();

    // Needed for CSS translates
    this.vendor =
        (/webkit/i).test(navigator.appVersion) ? '-webkit' :
            (/firefox/i).test(navigator.userAgent) ? '-moz' :
                (/msie/i).test(navigator.userAgent) ? 'ms' :
                    'opera' in window ? '-o' : '';

    this.cssTransform = this.vendor + '-transform';
    this.has3d = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix())
    this.trnOpen = 'translate' + (this.has3d ? '3d(' : '(');
    this.trnClose = this.has3d ? ',0)' : ')';
    this.scaleOpen = 'scale' + (this.has3d ? '3d(' : '(');
    this.scaleClose = this.has3d ? ',0)' : ')';

    // draw the slots to initial locations
    this.draw(true);
}

// Restar the game and determine the stopping locations for reels
Game.prototype.restart = function () {
    this.lastUpdate = new Date();
    this.speed1 = this.speed2 = this.speed3 = SLOT_SPEED

    //console.log('restart, this.spinCount: ' + this.spinCount);

    //DAB->20161013:
    this.spinCount++;

    this.iSpinCountDisp = this.spinCountMax - this.spinCount;
    if (this.iSpinCountDisp < 0) {
        this.iSpinCountDisp = 0;
    }
    $('#counter').text(this.iSpinCountDisp);

    //console.log('this.iSpinCountDisp: ' + this.iSpinCountDisp);

    // function locates id from items
    function _find(items, id) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].id == id) return i;
        }
    }

    //debugger;

    if (this.canWin) {
        // uncomment to get always jackpot
        if (this.spinCount == this.winSpin) {
            this.result1 = _find(this.items1, this.winSign);
            this.result2 = _find(this.items2, this.winSign);
            this.result3 = _find(this.items3, this.winSign);
        } else {
            //DAB->20161019: We ensure that the 3 signals will be different
            do {
                this.result1 = parseInt(Math.random() * this.items1.length)
                this.result2 = parseInt(Math.random() * this.items2.length)
                this.result3 = parseInt(Math.random() * this.items3.length)
            }
            //while (this.result1 == this.result2 && this.result1 == this.result3 && this.result1 != null);
            //while (this.items1[this.result1].id == this.items2[this.result2].id && this.items1[this.result1].id == this.items3[this.result3].id && this.result1 != null);
			
			//DAB->20170109: The position 1 in the array of items had the wrong item sign. So avoid that item.
			while (this.items1[this.result1].id == this.items2[this.result2].id && this.items1[this.result1].id == this.items3[this.result3].id && this.result1 != null
				|| (this.result1 == 1 || this.result2 == 1 || this.result3 == 1))
        }
    } else {
        //DAB->20161019: After the counter reaches 0 attempts we hide the play button
        if (this.iSpinCountDisp == 0) {
            $('#play').hide();
        }

        //DAB->20161019: We ensure that the 3 signals will be different
        do {
            this.result1 = parseInt(Math.random() * this.items1.length)
            this.result2 = parseInt(Math.random() * this.items2.length)
            this.result3 = parseInt(Math.random() * this.items3.length)
        }
        //while (this.result1 == this.result2 && this.result1 == this.result3 && this.result1 != null);
        //while (this.items1[this.result1].id == this.items2[this.result2].id && this.items1[this.result1].id == this.items3[this.result3].id && this.result1 != null);
		
		//DAB->20170109: The position 1 in the array of items had the wrong item sign. So avoid that item.
		while (this.items1[this.result1].id == this.items2[this.result2].id && this.items1[this.result1].id == this.items3[this.result3].id && this.result1 != null
			|| (this.result1 == 1 || this.result2 == 1 || this.result3 == 1))
			
        if (this.iSpinCountDisp == 0) {
            //Now, we redirect to No winner page
            //return redirect()->route('gamePlay.showError', ['domainName' => $strDomainName]);
            //window.location="{{ route('gamePlay.showNoMorePlay', ['domainName' => 'scbern.ch']); }}";
        }

    }

    // Clear stop locations
    this.stopped1 = false;
    this.stopped2 = false;
    this.stopped3 = false;

    // randomize reel locations
    this.offset1 = -parseInt(Math.random(ITEM_COUNT)) * SLOT_HEIGHT;
    this.offset2 = -parseInt(Math.random(ITEM_COUNT)) * SLOT_HEIGHT;
    this.offset3 = -parseInt(Math.random(ITEM_COUNT)) * SLOT_HEIGHT;

    $('#results').hide();

    this.state = 1;
}

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

Game.prototype.loop = function () {
    var that = this;
    that.running = true;
    (function gameLoop() {
        that.update();
        that.draw();
        if (that.running) {
            requestAnimFrame(gameLoop);
        }
    })();
}

Game.prototype.update = function () {

    var now = new Date();
    var that = this;

    // Check slot status and if spun long enough stop it on result
    function _check_slot(offset, result) {

        if (now - that.lastUpdate > SPINTIME) {
            var c = parseInt(Math.abs(offset / SLOT_HEIGHT)) % ITEM_COUNT;

            if (c == result) {
                if (result == 0) {
                    if (Math.abs(offset + (ITEM_COUNT * SLOT_HEIGHT)) < (SLOT_SPEED * 1.5)) {
                        console.log("slot v1")
                        console.log("offset " + offset + " result " + result + " c " + c);
                        return true; // done
                    }
                } else if (Math.abs(offset + (result * SLOT_HEIGHT)) < (SLOT_SPEED * 1.5)) {
                    console.log("slot v2")
                    console.log("offset " + offset + " result " + result + " c " + c);
                    return true; // done
                }
            }
        }
        return false;
    }

    switch (this.state) {
        case 1: // all slots spinning
            if (now - this.lastUpdate > RUNTIME) {
                this.state = 2;
                this.lastUpdate = now;
            }
            break;
        case 2: // slot 1
            this.stopped1 = _check_slot(this.offset1, this.result1);
            if (this.stopped1) {
                console.log(this.result1);
                this.speed1 = 0;
                this.state++;
                this.lastUpdate = now;
            }
            break;
        case 3: // slot 1 stopped, slot 2
            this.stopped2 = _check_slot(this.offset2, this.result2);
            if (this.stopped2) {
                console.log(this.result2);
                this.speed2 = 0;
                this.state++;
                this.lastUpdate = now;
            }
            break;
        case 4: // slot 2 stopped, slot 3
            this.stopped3 = _check_slot(this.offset3, this.result3);
            if (this.stopped3) {
                console.log(this.result3);
                this.speed3 = 0;
                this.state++;
            }
            break;
        case 5: // slots stopped
            if (now - this.lastUpdate > 3000) {
                this.state = 6;
            }
            break;
        case 6: // check results
            var ec = 0;
            var that = this;

            var energye = $('#results #score');

        function _add_win(delay, score) {

            setTimeout(function () {

            }, delay * 1000);
        }


            if (that.items1[that.result1].id == that.winSign) {
                ec++;
            }
            if (that.items2[that.result2].id == that.winSign) {
                ec++;
            }
            if (that.items3[that.result3].id == that.winSign) {
                ec++;
            }
            $('#multiplier').text(ec);


            if (that.canWin) {
                if (that.winSpin == that.spinCount) {
                    $('#results').show();
                    $('#status').text(BLURB_TBL[ec]);

                    that.spinCount = 0;

                    $('#play').attr('style', 'display: none;');
                    $('#winnerButton').attr('style', 'display: block;');

                    console.log("Winner... => change button");
                }
            } else {
                $('#results').show();
                $('#status').text(BLURB_TBL[ec]);
            }

            //DAB->20161019: Remove disable state for play button
            $('#play').prop('disabled', false);
            $('#play').removeClass('disabled-button');

            if (this.iSpinCountDisp == 0) {
                //Now, we redirect to No winner page after 5 seconds
                //return redirect()->route('gamePlay.showError', ['domainName' => $strDomainName]);

                //Check that we are not a winner also
                if (that.canWin) {

                } else {
                    //Not winner
                    setTimeout(
                        function () {
                            //Redirerct to following page after timeout was runing
                            $strDomainName = $("input[name='domain_name1']").val();
                            window.location = "./gamePlay/showNoMorePlay?domainName=" + $strDomainName;
                        }, 5000);
                }

            }

            this.state = 7;


            break;
        case 7: // game ends

            break;
        default:
    }
    this.lastupdate = now;
}

Game.prototype.draw = function (force) {

    if (this.state >= 6) return;

    // draw the spinning slots based on current state
    for (var i = 1; i <= 3; i++) {
        var resultp = 'result' + i;
        var stopped = 'stopped' + i;
        var speedp = 'speed' + i;
        var offsetp = 'offset' + i;
        var cp = 'c' + i;
        if (this[stopped] || this[speedp] || force) {
            if (this[stopped]) {
                //debugger;
                this[speedp] = 0;
                var c = this[resultp]; // get stop location
                this[offsetp] = -(c * SLOT_HEIGHT);

                if (this[offsetp] + DRAW_OFFSET > 0) {
                    // reset back to beginning
                    this[offsetp] = -this.resetOffset + SLOT_HEIGHT * 3;
                }

            } else {
                this[offsetp] += this[speedp];
                if (this[offsetp] + DRAW_OFFSET > 0) {
                    // reset back to beginning
                    this[offsetp] = -this.resetOffset + SLOT_HEIGHT * 3 - DRAW_OFFSET;
                }
            }
            // translate canvas location
            this[cp].css(this.cssTransform, this.trnOpen + '0px, ' + (this[offsetp] + DRAW_OFFSET) + 'px' + this.trnClose);
        }
    }
}
