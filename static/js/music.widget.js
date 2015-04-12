(function($) {
    $.fn.extend({
        musicwidget: function(options) {
            var defaults = {
                marginleft: 0,
                margintop: 0
            };
            var options = $.extend(defaults, options);
            return this.each(function() {
                var that = $(this);
                $(this).after('<div class="music-widget">\
                	<div class="music-widget-fm">\
                        <div class="music-widget-fm-info">\
                            <span class="music-widget-fm-info-title"></span>\
                            <br />\
                            <span class="music-widget-fm-info-author"></span>\
                        </div>\
                        <audio class="music-widget-fm-player" id="music-widget-fm-player" name="music-widget-fm-player" src="" autoplay></audio>\
                        <div class="music-widget-fm-controls">\
                            <span class="music-widget-fm-controls-play">∎</span>\
                            <span class="music-widget-fm-controls-cut">‣‣</span>\
                        </div>\
                    </div>\
                    <div class="music-widget-tips">推荐使用新版本<a href="http://www.google.com/chrome/">Chrome</a>、<a href="http://www.apple.com/safari/">Safari</a>。</div>\
                </div>');
                $(".music-widget").css({
                    "z-index":"12001",
                    "width":"230px",
                    "height":"130px",
                    "position":"absolute",
                    "left":that.offset().left + options.marginleft,
                    "top":that.offset().top + options.margintop,
                    "text-align":"left",
                    "cursor":"default"
                });
                $(".music-widget-fm").css({
                    "width":"194px",
                    "margin":"0 auto",
                    "padding":"10px",
                    "padding-bottom":"30px",
                    "background":"lightgray",
                    "color":"gray",
                    "border":"7px solid lightgray",
                    "border-radius":"10px",
                    "-webkit-border-radius":"7px",
                    "-moz-border-radius":"7px",
                    "-khtml-border-radius":"7px",
                    "box-shadow":"5px 5px 5px gainsboro",
                    "-webkit-box-shadow":"5px 5px 5px gainsboro",
                    "-moz-box-shadow":"5px 5px 5px gainsboro"
                });
                $(".music-widget-fm-info").css({
                    "background":"gainsboro",
                    "padding":"10px"
                });
                $(".music-widget-fm-info-title").css({
                    "font-size":"1.5em"
                });
                $(".music-widget-fm-info-author").css({
                    "font-size":"0.7em",
                    "padding-left":"2px"
                });
                $(".music-widget-fm-controls").css({
                    "float":"right"
                });
                $(".music-widget-fm-controls-play,.music-widget-fm-controls-cut").css({
                    "cursor":"pointer",
                    "font-size":"1.3em"
                });
                $(".music-widget-fm-controls-play,.music-widget-fm-controls-cut").hover(function(){
                    $(this).css({
                        "color":"white",
                        "cursor":"pointer"
                    });
                },function(){
                    $(this).css({
                        "color":"",
                        "cursor":"pointer"
                    });
                });
                $(".music-widget-tips").css({
                    "padding-top":"10px",
                    "color":"lightgray",
                    "width":"194px",
                    "margin":"0 auto",
                    "font-size":"0.7em",
                    "display":"none"
                });
                $(".music-widget-tips a").css({
                    "text-decoration":"none",
                    "color":"lightgray"
                });
                $(".music-widget-tips a").hover(function(){
                    $(this).css({
                        "color":"gray"
                    });
                },function(){
                    $(this).css({
                        "color":"lightgray"
                    });
                });
                
                $.get("/static/music",function(data){
                    var count=$(data).find("music").size();
                    var current=parseInt(location.href.split("#")[1]-1);
                    
                    var origintitle=$(document).attr("title");
                    
                    var cut=function(){
                        $(".music-widget-fm-controls-play").hide();
                        var random=parseInt(Math.random()*count);
                        if(random!=current){
                            current=random;
                            $(".music-widget-fm-info-title").text($($(data).find("music")[random]).children("title").text());
                            $(".music-widget-fm-info-author").text($($(data).find("music")[random]).children("author").text());
                            $(".music-widget-fm-player").attr("src",$($(data).find("music")[random]).children("url").text());
                            //document.title=$(".music-widget-fm-info-title").text()+"("+$(".music-widget-fm-info-author").text()+") - " + origintitle;
                            /*var state = {
                                title:document.title,
                                url:"/#"+(random+1)
                            };
                            window.history.pushState(state,document.title,"/#"+(random+1));*/
                        }
                        else{
                            cut();
                        }
                    }
                    $(".music-widget-fm-player").bind("ended",function(){
                        cut();
                    });
                    $(".music-widget-fm-player").bind("play",function(){
                        $(".music-widget-fm-controls-play").show();
                    });
                    $(".music-widget-fm-controls-play").click(function(){
                        //var player=document.getElementById("music-widget-fm-player");
                        var player=document.getElementsByName("music-widget-fm-player")[0];
                        if(player.paused){
                            $(this).text("∎");
                            player.play();
                        }
                        else{
                            $(this).text("▶");
                            player.pause();
                        }
                    });
                    $(".music-widget-fm-controls-cut").click(function(){
                        $(".music-widget-fm-controls-play").text("∎");
                        cut();
                    });
                    if(current>=0&&current<count){
                        $(".music-widget-fm-info-title").text($($(data).find("music")[current]).children("title").text());
                        $(".music-widget-fm-info-author").text($($(data).find("music")[current]).children("author").text());
                        $(".music-widget-fm-player").attr("src",$($(data).find("music")[current]).children("url").text());
                        //document.title=$(".music-widget-fm-info-title").text()+"("+$(".music-widget-fm-info-author").text()+") - " + origintitle;
                    }
                    else{
                        cut();
                    }
                });
            });
        }
    });   
})(jQuery);