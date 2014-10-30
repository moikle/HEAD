$(function() {
	// ROS object to connect to ROS

  var ros = new ROSLIB.Ros();
  var responses;


  var speech_topic = new ROSLIB.Topic({
    ros: ros,
    name: '/chatbot_speech',
    messageType: 'chatbot/ChatMessage'
  });

  function recognizeSpeech() {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Browser not supported. Use the newest Chrome browser');
    } else {
      var recognition = new webkitSpeechRecognition();

      recognition.onstart = function() {
        document.querySelector('#recordbutton').textContent =
          "Cancel recording";
      };

      recognition.onerror = function(event) {
        alert('Recognition error');
      };

      recognition.onend = function() {
        document.querySelector('#recordbutton').textContent =
          "Start recording";
      };

      recognition.onresult = function(event) {
        var utterance = event.results[0][0].transcript;
        var chat_message = new ROSLIB.Message({
          utterance: utterance,
          confidence: Math.round(event.results[0][0].confidence * 100)
        });
        speech_topic.publish(chat_message);
        console.log(utterance,": ", chat_message.confidence);
		addMessage('Me',utterance);
      };
      recognition.start();
    }
  }

  function ready(){
    responses = new ROSLIB.Topic({
		  ros : ros,
		  name : '/chatbot_responses',
		  messageType : 'std_msgs/String'
	});
    // Publish the response
	responses.subscribe(function(msg){
	  console.log(msg.data);
	  addMessage('Robot',msg.data);
	});
  }



  // Find out exactly when we made a connection.
  ros.on('connection', function() {
    ready();
    console.log('Connection made!');
    $('#recordbutton').click(function(){recognizeSpeech();});
 	console.log('Ready!');

  });
  // Create a connection to the rosbridge WebSocket server.
  ros.connect("wss://" + document.domain + ":9090");

function currentTime(){
    var d = new Date();
    var hr = d.getHours();
    var min = d.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    var ampm = hr < 12 ? "am" : "pm";
    if (hr > 12){hr = hr - 12;}
    return hr+":"+min+" "+ampm;
}

function addMessage(name, message){
    var el;
    if (name=='Robot'){
        el = $('#leftMsg').clone().removeAttr('id');
    }else{
        el = $('#rightMsg').clone().removeAttr('id');
    }
   $(el).find('.msg').text(message);
   $(el).find('.name').text(name);
   $(el).find('.time').text(currentTime());
   $('ul.chat').append(el);
   $(".content").animate({ scrollTop: $('.content')[0].scrollHeight}, 1000);

}

$('#btn-chat').click(function(){
        if ($('#btn-input').val() != ""){
            addMessage('Me',$('#btn-input').val());
			var chat_message = new ROSLIB.Message({
			  utterance: $('#btn-input').val(),
			  confidence: Math.round(0.9 * 100)
			});
			$('#btn-input').val('');
			speech_topic.publish(chat_message);
        }
    }
);







});

