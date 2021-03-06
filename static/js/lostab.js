﻿jQuery.cookie = function(name, value, options) {
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

		lostab.temp["rightsidebarbottom"] = lostab.temp["rightsidebartop"]+$("#rightsidebar").height();

		if($.cookie("author")!=null){
			obj.find("#comment-form").find("form").find("#comment-author").val($.cookie("author"));
		}
		if($.cookie("email")!=null){
			obj.find("#comment-form").find("form").find("#comment-email").val($.cookie("email"));
		}
		if($.cookie("url")!=null){
			obj.find("#comment-form").find("form").find("#comment-url").val($.cookie("url"));
		}
		
		if(page=="home"||page=="previous"||page=="next"){
			//obj.find(".post-link").show();
		}

		if(page=="home"&&q==""){
			obj.find("#search-form").submit(function(){
				if($.trim($("#search").val())=="" || (($("#search").css("color")=="#d3d3d3" || $("#search").css("color")=="rgb(211, 211, 211)") && $("#search").val()=="搜索")){
					$("#search").focus();
					return false;
				}
				$(this).find("#search-submit").val("搜索中…");
				$(this).find("#search-submit").attr("disabled",true);
				$("#wrapper").load("/?q="+encodeURIComponent($.trim($("#search").val()).substr(0, 128))+" #wrapper",function(){
					$(this).html($(this).children("#wrapper").html());
					that.ajax($(this));
				});
				return false;
			});
			obj.find("#header").find("a").not(".feed-link,.logout-link,.music-switch").click(function(){
				$("#header").after($("<div style=\"width:100%;position:fixed;_position:absolute;left:0;top:63px;text-align:center;\"><a style=\"background:lightblue;color:white;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;-khtml-border-radius:3px;\">加载中…</a></div>"));
				$(this).load($(this).attr("href")+" #wrapper",function(){
					$("#wrapper").html($(this).children("#wrapper").html());
					that.ajax($("#wrapper"));
					$("html,body").animate({scrollTop:0},800);
					
					var title = $(this).text();
					var url = $(this).attr("href");
					var state = {
						title: title,
						url: url
					};
					try{
						window.history.replaceState(state, title, url);
					}catch(e){}
				});
				return false;
			});
            obj.find("#header").find("a.music-switch").click(function(){
                if(mobile!="true"){
                    if($(".music-widget").length>0){
                        if($(".music-widget").css("display")=="none"){
                            $(".music-widget").fadeIn();
                        }else{
                            $(".music-widget").fadeOut();
                        }
                    }else{
                        //$("#rightsidebar").musicwidget({marginleft: 0, margintop: 1});
                        $("#wrapper").musicwidget({marginleft: $("#rightsidebar").offset().left-$("#wrapper").offset().left, margintop: $("#rightsidebar").offset().top-$("#wrapper").offset().top+1});
                    }
                }
            });
			obj.find("#publish-form,#config-form,#edit-post,#edit-comment").find(".cancel-link").click(function(){
				//$("#header").after($("<div style=\"width:100%;position:fixed;_position:absolute;left:0;top:63px;text-align:center;\"><a style=\"background:lightblue;color:white;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;-khtml-border-radius:3px;\">加载中…</a></div>"));
				$(this).after($("<span>加载中…</span>"));
				$(this).remove();
				$(this).load("/ #wrapper",function(){
					$("#wrapper").html($(this).children("#wrapper").html());
					that.ajax($("#wrapper"));
				});
				return false;
			});
			obj.find(".return-link").click(function(){
				//$("#header").after($("<div style=\"width:100%;position:fixed;_position:absolute;left:0;top:63px;text-align:center;\"><a style=\"background:lightblue;color:white;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;-khtml-border-radius:3px;\">加载中…</a></div>"));
				$(this).after($("<span>加载中…</span>"));
				$(this).remove();
				$(this).load("/ #wrapper",function(){
					$("#wrapper").html($(this).children("#wrapper").html());
					that.ajax($("#wrapper"));
					$("html,body").animate({scrollTop:0},800);
				});
				var title = $(this).text();
				var url = $(this).attr("href");
				var state = {
					title: title,
					url: url
				};
				try{
					window.history.replaceState(state, title, url);
				}catch(e){}
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
			/*obj.find(".delete-link").click(function(){
				if(confirm("确定删除？")){
					$.get($(this).attr("href"),function(){
						$("#wrapper").load($(this).attr("href")+" #wrapper",function(){
							$(this).html($(this).children("#wrapper").html());
							that.ajax($(this));
						});
					});
				}
				return false;
			});*/
			obj.find(".update-link").click(function(){
				$(this).load($(this).attr("href")+" #wrapper",function(){
					$("#wrapper").html($(this).children("#wrapper").html());
					that.ajax($("#wrapper"));
				});
				return false;
			});
			obj.find("#page-link").find("#previous-link").click(function foo(){
				$(this).unbind("click");
				$(this).hide();
				var url = $(this).attr("href");
				$(this).after($("<span>上一页加载中……</span>"));
				var thus = $(this);
				$(this).next().load(url+" #content",function(){
					that.ajax($(this).find("#content").find("#posts"));
					var previousposts = $(this).find("#content").find("#posts").find(".post");
					previousposts.prependTo($("#posts"));
					var previouspagelink = $(this).find("#page-link").find("#previous-link");
					$(this).remove();
					if(nextpagelink.length>0){
						thus.attr("href",previouspagelink.attr("href"));
						thus.bind("click",foo);
						thus.show();
					}
					else{
						thus.remove();
					}
				})
				return false;
			});
			obj.find("#page-link").find("#next-link").click(function foo(){
				$(this).unbind("click");
				$(this).hide();
				var url = $(this).attr("href");
				$(this).after($("<span id=\"pageloading\">下一页加载中……</span>"));
				var thus = $(this);
				$(this).next().load(url+" #content",function(){
					that.ajax($(this).find("#content").find("#posts"));
					var nextposts = $(this).find("#content").find("#posts").find(".post");
					nextposts.appendTo($("#posts"));
					nextposts.find(".post-title .post-permalink").each(function(){
						var post = $(this);
						$("#rightsidebar #recentposts").append("<li class=\"recentpost\"></li>");
						$("#rightsidebar #recentposts .recentpost:last").append(post.clone());
						$("#rightsidebar #recentposts .recentpost:last .post-permalink").click(function(){
							var postkey = $(this).attr("href").split("/post/")[1];
							$("html,body").animate({scrollTop:$("#post-"+postkey).offset().top},800);
							
							var title = $(this).text() + " - " + document.title;
							var url = $(this).attr("href");
							var state = {
								title: title,
								url: url
							};
							try{
								window.history.replaceState(state, title, url);
							}catch(e){}
							
							return false;
						});
					});
					lostab.temp["rightsidebarbottom"] = lostab.temp["rightsidebartop"]+$("#rightsidebar").height();
					var nextpagelink = $(this).find("#page-link").find("#next-link");
					$(this).remove();
					if(nextpagelink.length>0){
						thus.attr("href",nextpagelink.attr("href"));
						thus.bind("click",foo);
						thus.show();
					}
					else{
						thus.remove();
					}
				})
				return false;
			});
			obj.find(".comment-link").click(function thus(){
                if($(this).is(":hidden")){
                    return false;
                }
				/*if($("#comment-form").length>0){
					var pastpost = $("#comment-form").closest(".post");
					pastpost.html(that.temp["postcontent"].html());
					that.ajax(pastpost);
				}
				var currentpost = $(this).closest(".post");
				that.temp["postcontent"] = currentpost.clone();
				var url = $(this).attr("href").split("#")[0];
				$(this).after($("<span>评论加载中……</span>"));
				$(this).remove();
				currentpost.load(url+" #post",function(){
					$("#previous-next-post").remove();
					currentpost.find(".post").css("padding","0");
					that.ajax(currentpost);
					$("html,body").animate({scrollTop:$("#comment-form").offset().top},800);
				});*/
				var currentpost = $(this).closest(".post");
				var url = $(this).attr("href").split("#")[0];
				$(this).after($("<span>评论加载中……</span>"));
				$(this).hide();
				$(this).load(url+" #post-comment",function(){
					currentpost.append($(this).find("#post-comment"));
					that.ajax(currentpost.find("#post-comment"));
					//$("html,body").animate({scrollTop:currentpost.find("#comment-form").offset().top},800);
					$(this).prev().remove();
					$(this).next().remove();
					$(this).after($("<a class=\"close-comment-link\" style=\"cursor:pointer;display:none;\">收起</a>"));
					$(this).next(".close-comment-link").click(function(){
						$(this).before($("<a class=\"comment-link\" href=\""+url+"\">评论</a>"));
						if(currentpost.find("#post-comment .commentcount").length>0){
							$(this).prev().before($("<a class=\"commentcountlabel\"><span class=\"commentcount\">"+currentpost.find("#post-comment .commentcount").text()+"</span>条</a>"));
						}
						$(this).prev(".comment-link").click(thus);
						currentpost.find("#post-comment").remove();
						$(this).remove();
					});
					$(this).remove();
				});
				
				var title = document.title;
				var url = $(this).attr("href");
				var state = {
					title: title,
					url: url
				};
				try{
					window.history.replaceState(state, title, url);
				}catch(e){}
				
				return false;
			});
			obj.find(".post-permalink").click(function(){
				var postkey = $(this).attr("href").split("/post/")[1];
                var currentpage = window.location.href.split("//")[1].split(/[/#]/)[1];
                
                if(currentpage == "about" || currentpage == "guestbook"){
                    $("#header .home-link").click();
                    var gotorecentpost=function(){
                        if($("#post-"+postkey).length==0){
                            setTimeout(gotorecentpost,800);
                        }else{
                            $("html,body").animate({scrollTop:$("#post-"+postkey).offset().top},800);
                        }
                    }
                    gotorecentpost();
                    return false;
                }
                $("html,body").animate({scrollTop:$("#post-"+postkey).offset().top},800);
                
                var currentpost = $(this).closest(".post");
                if(currentpost.find("#post-comment").length>0){
                    currentpost.find(".close-comment-link").click();
                }else{
                    currentpost.find(".comment-link").click();
                }
                
                var title = $(this).text() + " - " + document.title;
                var url = $(this).attr("href");
                var state = {
                    title: title,
                    url: url
                };
                try{
                    window.history.replaceState(state, title, url);
                }catch(e){}
                
				return false;
			});
			obj.find(".comment-permalink").click(function(){
				var commentkey = $(this).attr("href").split("#comment-")[1];
				$("html,body").animate({scrollTop:$("#comment-"+commentkey).offset().top},800);
				
				var title = document.title;
				var url = $(this).attr("href");
				var state = {
					title: title,
					url: url
				};
				try{
					window.history.replaceState(state, title, url);
				}catch(e){}
				
				return false;
			});
			obj.find("#rightsidebar").find("#recentcomments").find(".recentcomment a").click(function(){
				var postkey = $(this).attr("href").split("#comment-")[0].split("/")[$(this).attr("href").split("#comment-")[0].split("/").length-1];
				var commentkey = $(this).attr("href").split("#comment-")[1];

				var title = document.title;
				var url = $(this).attr("href");
				var state = {
					title: title,
					url: url
				};
				
				var gotorecentcomment=function(){
					if(postkey=="guestbook"){
						$("#header .guestbook-link").click();
						if($("#comment-"+commentkey).length>0){
							$("html,body").animate({scrollTop:$("#comment-"+commentkey).offset().top},800);
							try{
								window.history.replaceState(state, title, url);
							}catch(e){}
						}else{
							setTimeout(gotorecentcomment,800);
						}
					}else{
						if($("#posts").length==0){
							$("#header #title a").click();
						}
						if($("#post-"+postkey).length>0){
							$("#post-"+postkey+" .operate .comment-link").click();
							if($("#comment-"+commentkey).length>0){
								$("html,body").animate({scrollTop:$("#comment-"+commentkey).offset().top},800);
								try{
									window.history.replaceState(state, title, url);
								}catch(e){}
							}else{
								setTimeout(gotorecentcomment,800);
							}
						}else{
							$("#page-link #next-link").click();
							setTimeout(gotorecentcomment,800);
						}
					}
				}
				gotorecentcomment();
				
				return false;
			});
			/*obj.find("#previous-next-post").find("a").click(function(){
				var url = $(this).attr("href");
				var currentpost = $(this).closest(".post").parent();
				$(this).after($("<span>文章加载中……</span>"));
				$(this).remove();
				currentpost.load(url+" #post",function(){
					that.ajax($(this));
				});
				return false;
			});*/
		
			$(".about .guestbook-link").click(function(){
				$("#header .guestbook-link").click();
				return false;
			});
		}

		obj.find("#search-form").submit(function(){
			if($.trim($("#search").val())=="" || (($("#search").css("color")=="#d3d3d3" || $("#search").css("color")=="rgb(211, 211, 211)") && $("#search").val()=="搜索")){
				$("#search").focus();
				return false;
			}
			$(this).find("#search-submit").val("搜索中…");
			$(this).find("#search-submit").attr("disabled",true);
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
			var currentpost = $(this).closest(".post");
			$.post("/add/comment",data,function(key){
				if(postkey!=""){
					currentpost.find("#post-comment").load("/post/"+postkey+" #post-comment",function(){
						$(this).after(currentpost.find("#post-comment #post-comment"));
						$(this).remove();
						that.ajax(currentpost.find("#post-comment"));
						$("html,body").scrollTop($("#comment-"+key).offset().top);
					});
				}
				else{
					currentpost.find("#post-comment").load("/guestbook #post-comment",function(){
						$(this).after(currentpost.find("#post-comment #post-comment"));
						$(this).remove();
						that.ajax(currentpost.find("#post-comment"));
						$("html,body").scrollTop($("#comment-"+key).offset().top);
					});
				}
				try{
					if(that.temp["postcontent"].find(".commentcount").length==0){
						that.temp["postcontent"].find(".comment-link").before("<a class=\"commentcountlabel\"><span class=\"commentcount\">1</span>条</a>");
					}
					else{
						that.temp["postcontent"].find(".commentcount").text(parseInt(that.temp["postcontent"].find(".commentcount").text())+1);
					}
				}catch(e){}
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
			var commentform = $(this).closest(".post").find("#comment-form");
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
		/*obj.find("#comment-form").find(".cancel-link").attr("href","");*/
		obj.find("#comment-form").find(".cancel-link").click(function(){
			var post = $(this).closest("#comment-form").find("#comment-post").val();
			var parentkey = $(this).closest("#comment-form").find("#comment-parentkey").val();
			$(this).closest(".comment").children(".operate").prepend('<a class="reply-link" href="/post/'+post+'?reply='+parentkey+'#comment-form" class="reply-link">回复</a> ');
			$(this).closest(".comment").find(".reply-link").click(function(){
				var parentkey = $(this).attr("href").split("?reply=")[1].split("#")[0];
				var commentform = $(this).closest(".post").find("#comment-form");
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
		obj.find("#search").bind("webkitspeechchange", function() {
			$(this).val($(this).val().substr(2));
			$("#search-form").submit();
		});

		obj.find("a").each(function(){
			if($(this).attr("href")!=""&&$(this).attr("href")!=undefined){
				if($(this).attr("href").substr(0,1)!="/" && $(this).attr("href").split("//").length>1){
					var targethost=$(this).attr("href").split("//")[1].split("/")[0];
					var currenthost=window.location.href.split("//")[1].split("/")[0];
					if(targethost!=currenthost){
						$(this).attr("target","_blank");
					}
				}
			}
		});

		obj.find(".post-content").find("img").bind("error",function(){
			$(this).after("<span style=\"color:gray;\">图片加载失败，很有可能你遇上<a href=\"http://zh.wikipedia.org/wiki/防火长城\" target=\"_blank\">GFW</a>了。</span>");
			$(this).remove();
		});
		obj.find(".comment-avator").find("img").bind("error",function(){
			$(this).remove();
		});
        
		/*obj.find(".operate a").not(".time,.return-link").css("color","white");
		obj.find(".operate").parent().mouseover(function(){
			$(this).children(".operate").find("a").not(".time,.return-link").css("color","green");
			$(this).children(".operate").find("a:hover").not(".time,.return-link").css("color","white");
			$(this).children(".operate").find("a:.commentcountlabel").css("color","gray");
		});
		obj.find(".operate").parent().mouseout(function(){
			$(this).children(".operate").find("a").not(".time,.return-link").css("color","white");
		});*/

		/*var loadrecentstate=function(){
			$.getJSON("http://v.t.qq.com/output/json.php?type=1&name=lostab&sign=7c058f557f638f0a0f44397a98eb58b07990664c&jsoncallback=?",weiboData=function(json){
				$("#recentstate").closest(".widget").remove();
				$("#rightsidebar").prepend("<div class=\"widget\" style=\"display:none;\"><h5>最近状态</h5><div id=\"recentstate\">"+json.data[0].content+"</div></div>");
				$("#recentstate").closest(".widget").slideDown();
				lostab.temp["rightsidebartop"] = $("#rightsidebar").offset().top;
				lostab.temp["rightsidebarbottom"] = lostab.temp["rightsidebartop"]+$("#rightsidebar").height();
			});
			setTimeout(function(){
				if($("#recentstate").length==0){
					loadrecentstate();
				}
			}, 800);
		}
		if($("#rightsidebar").length>0){
			loadrecentstate();
		}*/
	}
};

$(document).ready(function(){
	//$("#wrapper").hide();
	//$("#wrapper").fadeIn(800);
	if($("#rightsidebar").length>0){
		lostab.temp["rightsidebartop"] = $("#rightsidebar").offset().top;
		lostab.temp["rightsidebarbottom"] = lostab.temp["rightsidebartop"]+$("#rightsidebar").height();
        lostab.temp["scrolltop"] = 0;
	}
	lostab.ajax($("#wrapper"));
	/*$.get("/static/img/laputa.jpg",function(){
		$("body").css({"background": "url(/static/img/laputa.jpg) center no-repeat fixed"});
	});*/
	
	if(page=="home"&&q==""&&mobile!="true"){        
		$(window).scroll(function(){
			/*****************
			*取窗口滚动条高度*
			*****************/
			function getScrollTop(){
				var scrollTop=0;
				if(document.documentElement&&document.documentElement.scrollTop){
					scrollTop=document.documentElement.scrollTop;
				}
				else if(document.body){
					scrollTop=document.body.scrollTop;
				}
				return scrollTop;
			}
			/*********************
			*取窗口可视范围的高度*
			*********************/
			function getClientHeight(){
				var clientHeight=0;
				if(document.body.clientHeight&&document.documentElement.clientHeight){
					var clientHeight = (document.body.clientHeight<document.documentElement.clientHeight)?document.body.clientHeight:document.documentElement.clientHeight;
				}
				else{
					var clientHeight = (document.body.clientHeight>document.documentElement.clientHeight)?document.body.clientHeight:document.documentElement.clientHeight;
				}
				return clientHeight;
			}
			/*******************
			*取文档内容实际高度*
			*******************/
			function getScrollHeight(){
				return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
			}
			
			if(getScrollTop()+getClientHeight()+800>=getScrollHeight()){
				if($("#next-link").length>0){
					$("#next-link").click();
				}
			}
		});
	}

	$("#wrapper").after("<div id=\"returntop\" style=\"display:none;position:fixed;bottom:40px;right:10px;cursor:pointer;font-size:small;color:gray;\">返回顶部</div>");
	$("#returntop").click(function(){
		$("html,body").animate({scrollTop:0},800);
	});

    if(mobile!="true"){
        $(window).scroll(function(){
            /*****************
            *取窗口滚动条高度*
            *****************/
            function getScrollTop(){
                var scrollTop=0;
                if(document.documentElement&&document.documentElement.scrollTop){
                    scrollTop=document.documentElement.scrollTop;
                }
                else if(document.body){
                    scrollTop=document.body.scrollTop;
                }
                return scrollTop;
            }
            /*********************
            *取窗口可视范围的高度*
            *********************/
            function getClientHeight(){
                var clientHeight=0;
                if(document.body.clientHeight&&document.documentElement.clientHeight){
                    var clientHeight = (document.body.clientHeight<document.documentElement.clientHeight)?document.body.clientHeight:document.documentElement.clientHeight;
                }
                else{
                    var clientHeight = (document.body.clientHeight>document.documentElement.clientHeight)?document.body.clientHeight:document.documentElement.clientHeight;
                }
                return clientHeight;
            }
            /*******************
            *取文档内容实际高度*
            *******************/
            function getScrollHeight(){
                return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
            }
            
            if(getScrollTop()>0){
                $("#returntop").show();
            }else{
                $("#returntop").hide();
            }
            
            $("#rightsidebar").css({position:"relative"});
            if(($("#rightsidebar").height() + 34) >= getClientHeight()){
                if(getScrollTop() >= lostab.temp["rightsidebartop"]){
                    if(getScrollTop() >= lostab.temp["scrolltop"]){
                        if((getScrollTop() + getClientHeight()) >= ($("#rightsidebar").offset().top + $("#rightsidebar").height() + 34)){
                            $("#rightsidebar").css({"top": (getScrollTop() + getClientHeight() - $("#rightsidebar").height() - 34 - lostab.temp["rightsidebartop"]) + "px"});
                        }
                    }else{
                        if($("#rightsidebar").offset().top >= getScrollTop()){
                            $("#rightsidebar").css({"top": (getScrollTop() - lostab.temp["rightsidebartop"]) + "px"});
                        }
                    }
                }else{
                    $("#rightsidebar").css({"top": "0"});
                }
            }else{
                if(getScrollTop() >= lostab.temp["rightsidebartop"]){
                    $("#rightsidebar").css({"top": (getScrollTop() - lostab.temp["rightsidebartop"]) + "px"});
                }else{
                    $("#rightsidebar").css({"top": "0"});
                }
            }
            lostab.temp["scrolltop"] = getScrollTop();
            
        });
    }
});