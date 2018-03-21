
    var username =  userNickname;

    //Connect to socket.io
    var socket = io.connect('https://chatter-web.herokuapp.com/');

    // Check for connection 
    if(socket !== undefined) {
        console.log('Connected to socket...');
        // on connection to server, ask for user's name with an anonymous callback
	    socket.on('connect', function(){
            // call the server-side function 'adduser' and send one parameter (value of prompt)
            socket.emit('adduser', username);
        });

        socket.on('addeduser', function(name){
            username = name;
            $("#nicknameInfo").text(name);
        });

        // listener, whenever the server emits 'updatechat', this updates the chat body
        socket.on('updatechat', function (name, data) {
            if (username == name)
                $('#conversation').append('<div class="row"><div class="conversation-item my-message u-pull-right"><b>' + name + ':</b> ' + data + '</div></div>');
            else
                $('#conversation').append('<div class="row"><div class="conversation-item u-pull-left"><b>' + name + ':</b> ' + data + '</div></div>');

            //scroll to the bottom, when new message come with an animation
            $('#conversation').animate({
                scrollTop: $('#conversation')[0].scrollHeight
            }, 750);
        });

        socket.on('updatedname', function (oldName, newName, users, room) {
            username = newName;
            $('#nicknameInfo').text(username);
            $('#conversation').append('<div class="row"><div class="conversation-item u-pull-left"><b>SERVER:</b> ' + oldName + ' has changed his name to ' + newName + '</div></div>');
        
            $('#editName').replaceWith("<div class='u-pull-left' id='nicknameInfo'>" + username + "</div>");

            //clear list of active users and append new- refreshed
            $('#active').empty();
            users.forEach(function(user) {
                if (user.room == room) {
                    console.log(user.room);
                    $('#active').append("<div class='row'><div class='fa fa-circle green u-pull-left'></div><div class='u-pull-left user-online'>" + user.nickname + "</div></div>");
                }
            });
        });

        socket.on('alreadyExistName', function (newName, oldName) {
            $("#longNameError").text("Sorry, user with username " + newName + " already exist.");
            $("#longNameError").css("visibility", "visible");
            $('#editName').replaceWith("<div class='u-pull-left' id='nicknameInfo'>" + oldName + "</div>");

            //hide info and revert text with long name
            setTimeout(function() {
                $("#longNameError").css('visibility', 'hidden');
                $("#longNameError").text("Username must have at least 20 characters.");
            }, 2500);
        });

        socket.on('alreadyExistChannel', function (name) {
            $('#modalAddChannel').show();
            $('#left').addClass('disabled');
            $('#right').addClass('disabled');

            $("#longChannelError").text("Sorry, channel " + name + " already exists.");
            $("#longChannelError").css("visibility", "visible");

            setTimeout(function() {
                $("#longChannelError").css('visibility', 'hidden');
                $("#longChannelError").text("Channel name and password must have at least 20 characters.");
            }, 4000);
        });

        socket.on('updatednameinfo', function (oldName, newName, users, room) {
            $('#conversation').append('<div class="row"><div class="conversation-item u-pull-left"><b>SERVER:</b> ' + oldName + ' has changed his name to ' + newName + '</div></div>');
            
            //clear list of active users and append new- refreshed
            $('#active').empty();
            users.forEach(function(user) {
                if (user.room == room) {
                    $('#active').append("<div class='row'><div class='fa fa-circle green u-pull-left'></div><div class='u-pull-left user-online'>" + user.nickname + "</div></div>");
                }
            });
        });

        socket.on('roomPasswordRequest', function (room) {
            //$('#modalTypePassword').css('visibility', 'visible');
            $('#modalTypePassword').show();
            $('#left').addClass('disabled');
            $('#right').addClass('disabled');
            $('#modalRoomName').text(room);
        });

        socket.on('wrongPasswordInfo', function (room) {
            $('#modalTypePassword').show();
            $('#left').addClass('disabled');
            $('#right').addClass('disabled');
            $('#modalRoomName').text(room);

            $('#wrongPasswordError').css('visibility', 'visible');
            //after 3 seconds, hide errorInfo
            setTimeout(function() {
                $("#wrongPasswordError").css('visibility', 'hidden');
            }, 4000);
        });

        socket.on('updateonline', function (users, room) {
            $('#active').empty();

            if(users) {
                users.forEach(function(user) {
                    if (user.room == room) {
                        $('#active').append("<div class='row'><div class='fa fa-circle green u-pull-left'></div><div class='u-pull-left user-online'>" + user.nickname + "</div></div>");
                    }
                });
            }
        });

        // listener, whenever the server emits 'updaterooms', this updates the room the client is in
        socket.on('updaterooms', function(rooms, current_room) {
            $('#channels').empty();

            $.each(rooms, function(key, value) {
                if(value.name == current_room){
                    if (value.password && value.password != '' && value.password != undefined) {
                        $('#channels').append('<div class="row channel-item bold" id="' + value.name + '"><div class="u-pull-left" style="max-width: 90%; overflow: hidden;">' + '#' + value.name + '</div><div class="u-pull-right fa fa-lock"></div></div>');
                        $('#actualChannel').text('#' + value.name);
                    }
                    else {
                        $('#channels').append('<div class="row channel-item bold" id="' + value.name + '">' + '#' + value.name + '</div>');
                        $('#actualChannel').text('#' + value.name);
                    }
                }
                else {
                    if (value.password && value.password != '' && value.password != undefined) {
                        $('#channels').append('<div class="row channel-item" id="' + value.name + '" onclick="switchRoom(\'' + value.name + '\')"><div class="u-pull-left" style="max-width: 90%; overflow: hidden;">' + '#' + value.name + '</div><div class="u-pull-right fa fa-lock"></div></div>'); 
                    }
                    else {
                        $('#channels').append('<div class="row channel-item" id="' + value.name + '" onclick="switchRoom(\'' + value.name + '\')">' + '#' + value.name + '</div>');
                    }
            }
            });
        });

        socket.on('pushRoom', function(roomName, roomPassword) {
            //append addedRoom to roomList
            if (roomPassword)
                $('#channels').append('<div class="row channel-item" onclick="switchRoom(\'' + roomName + '\')"><div class="u-pull-left" style="max-width: 90%; overflow: hidden;">' + '#' + roomName + '</div><div class="u-pull-right fa fa-lock"></div></div>');
            else
                $('#channels').append('<div class="row channel-item" onclick="switchRoom(\'' + roomName + '\')">' + '#' + roomName + '</div>');  
        });

        socket.on('spliceRoom', function(roomName) {
            //append addedRoom to roomList
            $('#'+roomName).remove();  
        });

    // on load of page
	$(function(){
        $("#modalAddChannel").hide();
        $("#modalTypePassword").hide();

		// when the client clicks SEND
		$('#datasend').click( function() {
			var message = $('#data').val();
			$('#data').val('');
			// tell server to execute 'sendchat' and send along one parameter
			socket.emit('sendchat', message);
		});

        $('#openModalButton').click( function() {
            $('#modalAddChannel').show();
            $('#left').addClass('disabled');
            $('#right').addClass('disabled');
		});

        $('#addChannelButton').click( function() {
            //if channelName or channelPassword are too long, display info
            if($('#channelInput').val().length > 20 || $('#channelPasswordInput').val().length > 20) {
                $("#longChannelError").css('visibility', 'visible');

                //after 3 seconds, hide errorInfo
                setTimeout(function() {
                    $("#longChannelError").css('visibility', 'hidden');
                }, 3000);
            }
            else {
                if ( $('#channelInput').val() != '')
                    socket.emit('addChannel', $('#channelInput').val(), $('#channelPasswordInput').val());
                
                $('#modalAddChannel').hide();
                $('#left').removeClass('disabled');
                $('#right').removeClass('disabled');

                $("#channelInput").val('');
                $("#channelPasswordInput").val('');
            }
		});

        $('#closeModalButton').click( function() {
            $('#modalAddChannel').hide();
            $('#left').removeClass('disabled');
            $('#right').removeClass('disabled');

            $("#channelInput").val('');
            $("#channelPasswordInput").val('');
		});

        $('#closePasswordModalButton').click( function() {
            $('#modalTypePassword').hide();
            $('#left').removeClass('disabled');
            $('#right').removeClass('disabled');

            $("#channelPasswordRequestInput").val('');

            $('#wrongPasswordError').css('visibility', 'hidden');
		});

        $('#confirmPasswordButton').click( function() {
            socket.emit('confirmPasswordRequest', $('#modalRoomName').text(), $('#channelPasswordRequestInput').val());
            $('#modalTypePassword').hide();
            $('#left').removeClass('disabled');
            $('#right').removeClass('disabled');
            $('#wrongPasswordError').css('visibility', 'hidden');
            $("#channelPasswordRequestInput").val('');
		});

        $('#modalTypePassword').on('keypress', '#channelPasswordRequestInput', (function(e) {
			if(e.which == 13) {
                socket.emit('confirmPasswordRequest', $('#modalRoomName').text(), $('#channelPasswordRequestInput').val());
                $('#modalTypePassword').hide();
                $('#left').removeClass('disabled');
                $('#right').removeClass('disabled');
                $('#wrongPasswordError').css('visibility', 'hidden');
                $("#channelPasswordRequestInput").val('');
			}
		}));

        $(document).on('click', '#editButton', function() {
            event.stopPropagation();
            $('#editButton').replaceWith("<div class='fa fa-check-circle u-pull-right' id='applyEdit'></div>");
			$('#nicknameInfo').replaceWith("<div id='editName'><input class='u-pull-left' type='text' value=" + username + " id='editInput' /></div>");
            $('#editInput').focus();
		});

        $('#username').on('keypress', '#editInput', (function(e) {
			if(e.which == 13) {
                if($('#editInput').val() != '' && $('#editInput').val() != username) {
                    //if user typed too long name, show error sign
                    if($('#editInput').val().length > 20) {
                        $("#longNameError").css('visibility', 'visible');

                        setTimeout(function() {
                            $("#longNameError").css('visibility', 'hidden');
                        }, 3000);
                    }
                    else {
                        socket.emit("updatename", $('#editInput').val());
                    }
                }
                $('#editName').replaceWith("<div class='u-pull-left' id='nicknameInfo'>" + username + "</div>");
                $('#applyEdit').replaceWith("<div id='editButton' class='fa fa-pencil-square-o u-pull-right'></div>");
			}
		}));
        $(document).on('click', '#editInput', function() {
            //stopPropagation when user click on applyEdit button, to not hide editInput
            event.stopPropagation();
        });

        $(document).on('click', '#applyEdit', function() {
            event.stopPropagation();
            if($('#editInput').val() != '' && $('#editInput').val() != username) {
                //if user typed too long name, show error sign
                if($('#editInput').val().length > 20) {
                    $("#longNameError").css('visibility', 'visible');

                    setTimeout(function() {
                        $("#longNameError").css('visibility', 'hidden');
                    }, 3000);
                }
                else {
                    socket.emit("updatename", $('#editInput').val());
                }
            }
            $('#editName').replaceWith("<div class='u-pull-left' id='nicknameInfo'>" + username + "</div>");
            $('#applyEdit').replaceWith("<div id='editButton' class='fa fa-pencil-square-o u-pull-right'></div>");
		});

		// when the client hits ENTER on their keyboard
		$('#data').keypress(function(e) {
			if(e.which == 13) {
				$(this).blur();
				$('#datasend').focus().click();

                var message = $('#data').val();
			    $('#data').val('');
                socket.emit('sendchat', message);
                $('#data').focus();
			}
		});

        $(window).click(function() {
        //if editInput is active and user clicks outside it, we are replacing editInput by normal nickname
            if ($("#editInput")) {
                $('#editName').replaceWith("<div class='u-pull-left' id='nicknameInfo'>" + username + "</div>");
                $('#applyEdit').replaceWith("<div id='editButton' class='typcn typcn-pencil u-pull-right'></div>");
            }
        });
	});
    }

    function switchRoom(room){
		socket.emit('switchRoom', room);
	}