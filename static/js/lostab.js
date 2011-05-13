jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

var lostab = {
	temp:{},
	ajax:function(obj){
		var that = this;

		if($("#comment-form").length>0){
			if($.cookie("author")!=null){
				$("#comment-form").find("form").find("#comment-author").val($.cookie("author"));
			}
			if($.cookie("email")!=null){
				$("#comment-form").find("form").find("#comment-email").val($.cookie("email"));
			}
			if($.cookie("url")!=null){
				$("#comment-form").find("form").find("#comment-url").val($.cookie("url"));
			}
		}

		if(page=="home"&&q==""){
			obj.find("#search").val("搜索");
			obj.find("#search").css({"color":"#d3d3d3"});
			obj.find("#search").focus(function(){
				if(($(this).css("color")=="#d3d3d3" || $(this).css("color")=="rgb(211, 211, 211)") && $(this).val()=="搜索"){
					$(this).val("");
					$(this).css({"color":""});
				}
			});
			obj.find("#search").blur(function(){
				if($.trim($(this).val())==""){
					$(this).val("搜索");
					$(this).css({"color":"#d3d3d3"});
				}
			});
			obj.find("#search-form").submit(function(){
				if($.trim($("#search").val())=="" || (($("#search").css("color")=="#d3d3d3" || $("#search").css("color")=="rgb(211, 211, 211)") && $("#search").val()=="搜索")){
					$("#search").focus();
					return false;
				}
				$(this).find("#search-submit").val("搜索中…");
				$(this).find("#search-submit").attr("disabled",true);
				$("#wrapper").load("/?q="+encodeURIComponent($.trim($("#search").val()))+" #wrapper",function(){
					$(this).html($(this).children("#wrapper").html());
					that.ajax($(this));
				});
				return false;
			});
			obj.find(".post-link").show();
			/*obj.find(".post-link").click(function(){
				if($(this).parent().parent().find(".post-link-box").length==0){
					var siteurl = window.location.href;
					if(siteurl.charAt(siteurl.length-1)=="/"){
						siteurl = siteurl.slice(0,-1);
					}
					var posturl = $(this).attr("href");
					if(posturl.charAt(0)=="/"){
						posturl = siteurl + posturl;
					}
					$(this).parent().after("<div class=\"post-link-box\" style=\"clear:right;text-align:right;\"><input type=\"text\" value=\""+posturl+"\" style=\"width:400px;border:0;color:gray;\" readOnly />");
					$(this).parent().parent().find(".post-link-box").find("input").select();
					$(this).parent().parent().find(".post-link-box").find("input").click(function(){
						$(this).select();
					});
					$(this).hover(function(){
						$(this).css({"background":"green","color":"white","border-radius":"3px"});
					},function(){
						$(this).css({"background":"green","color":"white","border-radius":"3px"});
					});
				}
				else{
					$(this).parent().parent().find(".post-link-box").remove();
					$(this).hover(function(){
						$(this).css({"background":"green","color":"white","border-radius":"3px"});
					},function(){
						$(this).css({"background":"none","color":"green"});
					});
				}
				$(this).blur();
				return false;
			});*/
			obj.find("#header").find("a").not(".feed-link,.logout-link").click(function(){
				$("#header").after($("<div style=\"width:100%;position:fixed;_position:absolute;left:0;top:10px;text-align:center;\"><a style=\"background:lightblue;color:white;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;-khtml-border-radius:3px;\">加载中……</a></div>"));
				$(this).load($(this).attr("href")+" #wrapper",function(){
					$("#wrapper").html($(this).children("#wrapper").html());
					that.ajax($("#wrapper"));
				});
				return false;
			});
			obj.find("#publish-form,#config-form,#edit-post,#edit-comment").find(".cancel-link").click(function(){
				$("#header").after($("<div style=\"width:100%;position:fixed;_position:absolute;left:0;top:10px;text-align:center;\"><a style=\"background:lightblue;color:white;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;-khtml-border-radius:3px;\">加载中……</a></div>"));
				$(this).load("/ #wrapper",function(){
					$("#wrapper").html($(this).children("#wrapper").html());
					that.ajax($("#wrapper"));
				});
				return false;
			});
			obj.find(".return-link").click(function(){
				$("#header").after($("<div style=\"width:100%;position:fixed;_position:absolute;left:0;top:10px;text-align:center;\"><a style=\"background:lightblue;color:white;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;-khtml-border-radius:3px;\">加载中……</a></div>"));
				$(this).load("/ #wrapper",function(){
					$("#wrapper").html($(this).children("#wrapper").html());
					that.ajax($("#wrapper"));
				});
				return false;
			});
			obj.find("#simple-publish,#publish-form").find("form").submit(function(){
				if($.trim($(this).find("#post-content").val())==""){
					$(this).find("#post-content").focus();
					return false;
				}
				var data = {
					"content":$.trim($(this).find("#post-content").val()),
					"type":"ajax"
				};
				if($(this).find("#post-title").length>0){
					data["title"] = $.trim($(this).find("#post-title").val());
				}
				$(this).find("#post-submit").val("发布中…");
				$(this).find("#post-submit").attr("disabled",true);
				$.post("/add/post",data,function(){
					$("#wrapper").load("/"+" #wrapper",function(){
						$(this).html($(this).children("#wrapper").html());
						that.ajax($(this));
					});
				});
				return false;
			});
			obj.find("#edit-post").find("form").submit(function(){
				if($.trim($(this).find("#post-content").val())==""){
					$(this).find("#post-content").focus();
					return false;
				}
				var data = {
					"title":$.trim($(this).find("#post-title").val()),
					"content":$.trim($(this).find("#post-content").val()),
					"key":$.trim($(this).find("#post-key").val()),
					"type":"ajax"
				};
				$(this).find("#post-submit").val("提交中…");
				$(this).find("#post-submit").attr("disabled",true);
				$.post("/update/post",data,function(){
					$("#wrapper").load("/"+" #wrapper",function(){
						$(this).html($(this).children("#wrapper").html());
						that.ajax($(this));
					});
				});
				return false;
			});
			obj.find("#edit-comment").find("form").submit(function(){
				var email = /^(?:^|\s)[-a-z0-9_.]+@(?:[-a-z0-9]+\.)+[a-z]{2,6}(?:\s|$)/;
				if($.trim($(this).find("#comment-email").val())!=""&&!email.test($.trim($(this).find("#comment-email").val()))){
					$(this).find("#comment-email").focus();
					return false;
				}
				var url = /^http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/;
				if($.trim($(this).find("#comment-url").val())!=""&&!url.test($.trim($(this).find("#comment-url").val()))){
					$(this).find("#comment-url").focus();
					return false;
				}
				if($.trim($(this).find("#comment-content").val())==""){
					$(this).find("#comment-content").focus();
					return false;
				}
				var postkey = $.trim($(this).find("#comment-post").val());
				var data = {
					"author":$.trim($(this).find("#comment-author").val()),
					"email":$.trim($(this).find("#comment-email").val()),
					"url":$.trim($(this).find("#comment-url").val()),
					"content":$.trim($(this).find("#comment-content").val()),
					"key":$(this).find("#comment-key").val(),
					"type":"ajax"
				};
				$(this).find("#comment-submit").val("提交中…");
				$(this).find("#comment-submit").attr("disabled",true);
				$.post("/update/comment",data,function(){
					$("#wrapper").load("/"+" #wrapper",function(){
						$(this).html($(this).children("#wrapper").html());
						that.ajax($(this));
					});
				});
				return false;
			});
			obj.find("#config-form").find("form").submit(function(){
				if($.trim($(this).find("#site-title").val())==""){
					$(this).find("#site-title").focus();
					return false;
				}
				if($.trim($(this).find("#site-author").val())==""){
					$(this).find("#site-author").focus();
					return false;
				}
				var email = /^(?:^|\s)[-a-z0-9_.]+@(?:[-a-z0-9]+\.)+[a-z]{2,6}(?:\s|$)/;
				if($.trim($(this).find("#site-email").val())!=""&&!email.test($.trim($(this).find("#site-email").val()))){
					$(this).find("#site-email").focus();
					return false;
				}
				var url = /^http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/;
				if($.trim($(this).find("#site-url").val())!=""&&!url.test($.trim($(this).find("#site-url").val()))){
					$(this).find("#site-url").focus();
					return false;
				}
				var data = {
					"title":$.trim($(this).find("#site-title").val()),
					"author":$.trim($(this).find("#site-author").val()),
					"email":$.trim($(this).find("#site-email").val()),
					"url":$.trim($(this).find("#site-url").val()),
					"description":$.trim($(this).find("#site-description").val()),
					"type":"ajax"
				};
				$(this).find("#config-submit").val("提交中…");
				$(this).find("#config-submit").attr("disabled",true);
				$.post("/config",data,function(){
					$("#wrapper").load("/"+" #wrapper",function(){
						$(this).html($(this).children("#wrapper").html());
						that.ajax($(this));
					});
				});
				return false;
			});
			obj.find(".delete-link").click(function(){
				if(confirm("确定删除？")){
					$.get($(this).attr("href"),function(){
						$("#wrapper").load($(this).attr("href")+" #wrapper",function(){
							$(this).html($(this).children("#wrapper").html());
							that.ajax($(this));
						});
					});
				}
				return false;
			});
			obj.find(".update-link").click(function(){
				$(this).load($(this).attr("href")+" #wrapper",function(){
					$("#wrapper").html($(this).children("#wrapper").html());
					that.ajax($("#wrapper"));
				});
				return false;
			});
			obj.find("#page-link").find("#previous-link").click(function(){
				var currentposts = $("#posts").html();
				if($("#simple-publish").length>0){
					var simplepublish = $("#simple-publish").clone();
				}
				else{
					var simplepublish = "";
				}
				var nextpagelink = "";
				var url = $(this).attr("href");
				$(this).after($("<span>上一页加载中……</span>"));
				$(this).remove();
				if($("#page-link #next-link").length>0){
					nextpagelink = $("#page-link #next-link").attr("href");
				}
				$("#content").parent().load(url+" #content",function(){
					$("#posts").append(currentposts);
					if(simplepublish!=""){
						$("#content").prepend(simplepublish);
					}
					if(nextpagelink!=""){
						$("#page-link #next-link").attr("href",nextpagelink);
					}
					else{
						$("#page-link #next-link").remove();
					}
					that.ajax($("#content").parent());
				})
				return false;
			});
			obj.find("#page-link").find("#next-link").click(function(){
				var currentposts = $("#posts").html();
				if($("#simple-publish").length>0){
					var simplepublish = $("#simple-publish").clone();
				}
				else{
					var simplepublish = "";
				}
				var previouspagelink = "";
				var url = $(this).attr("href");
				$(this).after($("<span>下一页加载中……</span>"));
				$(this).remove();
				if($("#page-link #previous-link").length>0){
					previouspagelink = $("#page-link #previous-link").attr("href");
				}
				$("#content").parent().load(url+" #content",function(){
					$("#posts").prepend(currentposts);
					if(simplepublish!=""){
						$("#content").prepend(simplepublish);
					}
					if(previouspagelink!=""){
						$("#page-link #previous-link").attr("href",previouspagelink);
					}
					else{
						$("#page-link #previous-link").remove();
					}
					that.ajax($("#content").parent());
				})
				return false;
			});
			obj.find(".comment-link").click(function(){
				if($("#comment-form").length>0){
					var pastpost = $("#comment-form").closest(".post");
					pastpost.html(that.temp["postcontent"].html());
					//pastpost.css({"background":""});
					that.ajax(pastpost);
				}
				var currentpost = $(this).closest(".post");
				that.temp["postcontent"] = currentpost.clone();
				var url = $(this).attr("href").split("#")[0];
				$(this).after($("<span>评论加载中……</span>"));
				$(this).remove();
				currentpost.load(url+" #post",function(){
					$("#previous-next-post").remove();
					currentpost.find(".post-link").show();
					that.ajax(currentpost);
					//currentpost.css({"background":"lightgray"});
					$("html,body").scrollTop($("#comment-form").offset().top);
				});
				return false;
			});
			/*obj.find("#previous-next-post").find("a").click(function(){
				var url = $(this).attr("href");
				var currentpost = $(this).closest("#post").parent();
				$(this).after($("<span>文章加载中……</span>"));
				$(this).remove();
				currentpost.load(url+" #post",function(){
					that.ajax($(this));
				});
				return false;
			});*/
		}
		obj.find("#comment-form").find("form").submit(function(){
			var email = /^(?:^|\s)[-a-z0-9_.]+@(?:[-a-z0-9]+\.)+[a-z]{2,6}(?:\s|$)/;
			if($.trim($(this).find("#comment-email").val())!=""&&!email.test($.trim($(this).find("#comment-email").val()))){
				$(this).find("#comment-email").focus();
				return false;
			}
			var url = /^http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/;
			if($.trim($(this).find("#comment-url").val())!=""&&!url.test($.trim($(this).find("#comment-url").val()))){
				$(this).find("#comment-url").focus();
				return false;
			}
			if($.trim($(this).find("#comment-content").val())==""){
				$(this).find("#comment-content").focus();
				return false;
			}
			var captcha = /[0-9]/;
			if(!captcha.test($.trim($(this).find("#comment-captcha").val()))){
				$(this).find("#comment-captcha").focus();
				return false;
			}
			var data = {
				"author":$.trim($(this).find("#comment-author").val()),
				"email":$.trim($(this).find("#comment-email").val()),
				"url":$.trim($(this).find("#comment-url").val()),
				"content":$.trim($(this).find("#comment-content").val()),
				"captcha":$.trim($(this).find("#comment-captcha").val()),
				"type":"ajax"
			};
			var postkey = "";
			if($(this).find("#comment-post").length>0){
				postkey = $.trim($(this).find("#comment-post").val());
				data["post"] = postkey;
			}
			if($(this).find("#comment-parentkey").length>0){
				data["parentkey"] = $(this).find("#comment-parentkey").val();
			}
			$(this).find("#comment-submit").val("提交中…");
			$(this).find("#comment-submit").attr("disabled",true);
			var currentpost = $(this).closest("#post").parent();
			$.post("/add/comment",data,function(key){
				if(postkey!=""){
					currentpost.load("/post/"+postkey+" #post",function(){
						if($("#posts").length>0){
							$("#previous-next-post").remove();
						}
						that.ajax($(this));
						$("html,body").scrollTop($("#comment-"+key).offset().top);
					});
				}
				else{
					currentpost.load("/guestbook #post",function(){
						if($("#posts").length>0){
							$("#previous-next-post").remove();
						}
						that.ajax($(this));
						$("html,body").scrollTop($("#comment-"+key).offset().top);
					});
				}
				if(that.temp["postcontent"].find(".commentcount").length==0){
					that.temp["postcontent"].find(".comment-link").before("<span class=\"commentcount\">1</span>条");
				}
				else{
					that.temp["postcontent"].find(".commentcount").text(parseInt(that.temp["postcontent"].find(".commentcount").text())+1);
				}
			});
			
			if(data.author!=""){
				$.cookie("author", data.author, {expires: 366});
			}
			if(data.email!=""){
				$.cookie("email", data.email, {expires: 366});
			}
			if(data.url!=""){
				$.cookie("url", data.url, {expires: 366});
			}
			
			return false;
		});
		obj.find(".reply-link").click(function(){
			var parentkey = $(this).attr("href").split("?reply=")[1].split("#")[0];
			var commentform = $(this).closest("#post").find("#comment-form");
			if(commentform.find("#comment-parentkey").length>0){
				commentform.closest(".comment").find(".reply-link").show();
				commentform.find(".cancel-link").remove();
				commentform.find("#comment-parentkey").val(parentkey);
			}
			else{
				commentform.find("form").append('<br /><input id="comment-parentkey" type="hidden" value="'+parentkey+'" name="parentkey">');
			}
			if(commentform.children(".operate").length>0){
				commentform.children(".operate").prepend('<a class="cancel-link" href="">取消</a>');
			}
			else{
				commentform.append('<div class="operate"><a class="cancel-link" href="">取消</a></div>');
			}
			commentform.find(".cancel-link").click(function(){
				$(this).closest(".comment").find(".reply-link").show();
				$(this).closest("#comments-list").before($(this).closest("#comment-form"));
				$(this).closest("#comment-form").find("#comment-parentkey").remove();
				$(this).closest("#comment-form").find("br").last().remove();
				$(this).remove();
				return false;
			});
			$(this).closest(".operate").after(commentform);
			$(this).hide();
			return false;
		});
		obj.find("#comment-form").find(".cancel-link").attr("href","");
		obj.find("#comment-form").find(".cancel-link").click(function(){
			var post = $(this).closest("#comment-form").find("#comment-post").val();
			var parentkey = $(this).closest("#comment-form").find("#comment-parentkey").val();
			$(this).closest(".comment").children(".operate").prepend('<a class="reply-link" href="/post/'+post+'?reply='+parentkey+'#comment-form" class="reply-link">回复</a> ');
			$(this).closest(".comment").find(".reply-link").click(function(){
				var parentkey = $(this).attr("href").split("?reply=")[1].split("#")[0];
				var commentform = $(this).closest("#post").find("#comment-form");
				if(commentform.find("#comment-parentkey").length>0){
					commentform.closest(".comment").find(".reply-link").show();
					commentform.find(".cancel-link").remove();
					commentform.find("#comment-parentkey").val(parentkey);
				}
				else{
					commentform.find("form").append('<br /><input id="comment-parentkey" type="hidden" value="'+parentkey+'" name="parentkey">');
				}
				if(commentform.children(".operate").length>0){
					commentform.children(".operate").prepend('<a class="cancel-link" href="">取消</a>');
				}
				else{
					commentform.append('<div class="operate"><a class="cancel-link" href="">取消</a></div>');
				}
				commentform.find(".cancel-link").click(function(){
					$(this).closest(".comment").find(".reply-link").show();
					$(this).closest("#comments-list").before($(this).closest("#comment-form"));
					$(this).closest("#comment-form").find("#comment-parentkey").remove();
					$(this).closest("#comment-form").find("br").last().remove();
					$(this).remove();
					return false;
				});
				$(this).closest(".operate").after(commentform);
				$(this).hide();
				return false;
			});
			$(this).closest("#comments-list").before($(this).closest("#comment-form"));
			$(this).closest("#comment-form").find("#comment-parentkey").remove();
			$(this).closest("#comment-form").find("br").last().remove();
			$(this).remove();
			return false;
		});
	}
};

$(document).ready(function(){
	$("#wrapper").hide();
	$("#wrapper").fadeIn(800);
	lostab.ajax($("#wrapper"));
	$.get("static/img/laputa.jpg",function(){
		$("body").css({"background": "url(static/img/laputa.jpg) center no-repeat fixed"});
	});
});