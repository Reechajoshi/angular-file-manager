angular.module('bootswatchApp').controller('DashboardCtrl',
	['$scope','$location','$window','$anchorScroll','bootswatchAuth','UserService',
	function($scope,$location,$window,$anchorScroll,bootswatchAuth,UserService){

	if(bootswatchAuth.getUser().theme != "default")
		$("#bootstrap_theme").attr("href","../bower_components/bootswatch/"+bootswatchAuth.getUser().theme+"/bootstrap.min.css" );

	$scope.changeTheme = function(name){
			if(name!="default")
		    	$("#bootstrap_theme").attr("href","../bower_components/bootswatch/"+name+"/bootstrap.min.css");
		    else
		    	$("#bootstrap_theme").attr("href","#" );
		    var data = bootswatchAuth.getUser().username+","+bootswatchAuth.getUser().password+","+name;
		    UserService.updateTheme({data:data,username:bootswatchAuth.getUser().username}).then(function(result){
		    	var user = bootswatchAuth.getUser();
		    	user.theme = name;
		    	bootswatchAuth.setUser(user);
		    });
	};

	$scope.goto = function(name){
		$location.hash(name);
      	$anchorScroll();
	};
	
	$scope.loadFileManager = function(){
		$location.path('/file-manager');
	};

	$scope.logout = function(){
		bootswatchAuth.isAuthenticated = false;
		bootswatchAuth.setLocalAuth(null);
		bootswatchAuth.deleteUser();
		$location.path('/login').search({});
	};

	var $button = $("<div id='source-button' class='btn btn-primary btn-xs'>&lt; &gt;</div>").click(function(){
	    var html = $(this).parent().html();
	    html = cleanSource(html);
	    $("#source-modal pre").text(html);
	    $("#source-modal").modal();
	  });

	  $('.bs-component [data-toggle="popover"]').popover();
	  $('.bs-component [data-toggle="tooltip"]').tooltip();

	  $(".bs-component").hover(function(){
	      $(this).append($button);
	      $button.show();

	  }, function(){
	    $button.hide();
	  });

	  function cleanSource(html) {
	  	html = html.replace(/×/g, "&times;")
               .replace(/«/g, "&laquo;")
               .replace(/»/g, "&raquo;")
               .replace(/←/g, "&larr;")
               .replace(/→/g, "&rarr;");
               
	    var lines = html.split(/\n/);

	    lines.shift();
	    lines.splice(-1, 1);

	    var indentSize = lines[0].length - lines[0].trim().length,
	        re = new RegExp(" {" + indentSize + "}");

	    lines = lines.map(function(line){
	      if (line.match(re)) {
	        line = line.substring(indentSize);
	      }

	      return line;
	    });

	    lines = lines.join("\n");

	    return lines;
	  }



}]);



	