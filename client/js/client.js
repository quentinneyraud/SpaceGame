

function GameController($scope) {

	$scope.submitGameName = function createNewGame(){
		socket.emit('sendGameName', { 'name' : $scope.gameName, 'mobile' : mobile});
	}

$scope.power =0;



var socket = io.connect();

var notification = $('#notification');
var mobile = false;


if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ){
	mobile = true;
}else{
	var vaisseau = $('#vaisseau');
}




socket.on('message', function(data){
  alert(data);
});

socket.on('notification', function(params){
  if(params.state == 'success'){
    notification.css('background-color', 'green');
  }else if(params.state == 'alert'){
    notification.css('background-color', 'orange');
  }else if(params.state == 'error'){
    notification.css('background-color', 'red');
  }

  $('#notificationText').html(params.text);

  notification.animate({
    'top' : '0px'
  },200, function(){
    setTimeout(function(){
      notification.animate({
        'top' : '-100px'
      },200);
    },2000);
  });

});



socket.on('connect', function () {
	$('#loader').remove();
});




socket.on('gameAddSuccess', function(data){
	$('#form').remove();
	$('#gameTitle').append("Votre partie : " + data);
});

socket.on('unlinkScreenKeypad',function(){
	setTimeout(function(){
		location.reload();
	},1400);
});

socket.on('startGame', function(){

	$('#form, #gameTitle').hide();

	if(mobile){

		$('#keypad').show();

		var objDevice = {};

		window.addEventListener('deviceorientation', function(event) {
			objDevice.betaPosition = Math.round(event.beta);
			objDevice.gammaPosition = Math.round(event.gamma);
		});

		setInterval(function(){
			if(objDevice.betaPosition > -85 && objDevice.betaPosition < 85 && objDevice.gammaPosition > 0 && objDevice.gammaPosition < 85){
				socket.emit('devicemotion', objDevice);
			}
		},30);

		document.getElementById('aButton').addEventListener('click', function(){
			socket.emit('aClick');
		});

		document.getElementById('bButton').addEventListener('click', function(){
			socket.emit('bClick');
		});


  	}else{
    	$('#screen').show()
    				.animate({
    					'opacity' : '1'
    				},500);

    	$('html').css('cursor', 'none');

    	var timerCount = 5;

    	var timer = setInterval(function(){

    		if(timerCount == 0){
    			clearInterval(timer);
    			$('#count').remove();
    		}else{
    			$('#count').html(timerCount);
    			timerCount--;
    		}

    	},1000);


    	setTimeout(function(){

    		setInterval(function(){
    			var img = document.createElement('img');
						img.className = 'ennemi';
						img.style.top = '-94px';
						img.style.left = Math.random()*($(window).width() - 130) + 'px';
						img.src='../img/ennemi.png';

						$('#screen').append(img);

						$('.ennemi').animate({
							'top' : $(window).height() + 'px'
						},5000,function(){
							$(this).remove();
						})
    		},1500);

    	},5000);



  	}

});

var topNavire;
var leftNavire;

socket.on('devicemotion', function(data){

	data.gammaPosition -= 45;
	data.betaPosition *= -1;

	topNavire = vaisseau.offset().top;
	leftNavire = vaisseau.offset().left;

	var nextTopNavire = topNavire + data.gammaPosition;
	var nextLeftNavire = leftNavire + data.betaPosition;

	if(nextTopNavire < 0){
		nextTopNavire = 0;
	}else if(nextTopNavire+vaisseau.height() > $(window).height()){
		nextTopNavire = $(window).height()-vaisseau.height();
	}

	if(nextLeftNavire < 0){
		nextLeftNavire = 0;
	}else if(nextLeftNavire+vaisseau.width() > $(window).width()){
		nextLeftNavire = $(window).width()-vaisseau.width();
	}

	vaisseau.css({
		'top' : nextTopNavire + 'px',
		'left' : nextLeftNavire + 'px'
	});

});

socket.on('aClick', function(){

    missile(topNavire-70, leftNavire + 75);

});

socket.on('bClick', function(){

	if($scope.power >= 20 ){
		missile(topNavire+10, leftNavire + 40);
		missile(topNavire+10, leftNavire + 115);
		$scope.$apply(function(){
       		$scope.power -= 20;
       	});
	}

});



function missile(topPos, leftPos){
		var div = document.createElement('div');
	div.className = 'faisceau';
	div.style.top = topPos +'px';
	div.style.left = leftPos + 'px';

	$('#screen').append(div);

	$(div).animate(
		{
			'top' : '-80px'
		},
		{
			step : function(now){
				var left = $(this).offset().left;
				$('.ennemi').each(function(){
					if(leftPos > $(this).offset().left && leftPos < $(this).offset().left+130 && now < $(this).offset().top+94 && now > $(this).offset().top){
						$(this).remove();
						$(div).remove();
						$scope.$apply(function(){
       						$scope.power += 10;
       					});
					}
				});
			},
			complete : function(){
				$(this).remove();
			}
		}
	);
}


}
