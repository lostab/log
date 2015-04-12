# -*- coding: utf-8 -*-

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

import cgi
import datetime
import wsgiref.handlers
import os

import settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template

import hashlib
import re
from google.appengine.api import memcache
import random
from datetime import timedelta
from google.appengine.api import mail

import webapp2
from django.template import Template as template
from django.template.loader import render_to_string

import urllib2
from django.utils import simplejson as json

PAGESIZE = 10
FETCHSIZE = 999

class Site(db.Model):
    title = db.TextProperty()
    author = db.TextProperty()
    email = db.TextProperty()
    url = db.TextProperty()
    description = db.TextProperty()

class Post(db.Model):
    title = db.TextProperty()
    content = db.TextProperty()
    time = db.DateTimeProperty(auto_now_add=True)

class Comment(db.Model):
    author = db.StringProperty(multiline=False)
    email = db.StringProperty(multiline=False)
    url = db.StringProperty(multiline=False)
    content = db.TextProperty()
    time = db.DateTimeProperty(auto_now_add=True)
    post = db.StringProperty(multiline=False)
    parentkey = db.StringProperty(multiline=False)

def getposts(number, morekey, string, type):
    try:
        if type and type == 'previous':
            if morekey:
                post = Post.all().order('-__key__').filter('__key__ =', morekey).get()
                query = Post.gql('WHERE time = :time AND __key__ < :key ORDER BY __key__ DESC, time ASC', time = post.time, key = morekey)
                posts = query.fetch(number + 1)
                if len(posts) < number + 1:
                    remainder = number + 1 - len(posts)
                    query = Post.gql('WHERE time > :time ORDER BY time ASC, __key__ DESC', time = post.time)
                    moreposts = query.fetch(remainder)
                    posts += moreposts
            else:
                query = Post.gql('ORDER BY time ASC, __key__ DESC')
                posts = query.fetch(number + 1)
        else:
            if morekey:
                post = Post.all().order('-__key__').filter('__key__ =', morekey).get()
                query = Post.gql('WHERE time = :time AND __key__ > :key ORDER BY __key__ ASC, time DESC', time = post.time, key = morekey)
                posts = query.fetch(number + 1)
                if len(posts) < number + 1:
                    remainder = number + 1 - len(posts)
                    query = Post.gql('WHERE time < :time ORDER BY time DESC, __key__ ASC', time = post.time)
                    moreposts = query.fetch(remainder)
                    posts += moreposts
            else:
                query = Post.gql('ORDER BY time DESC, __key__ ASC')
                posts = query.fetch(number + 1)

        postslength = len(posts)
        for post in posts[:number]:
            if string and not re.search(string.replace(' ', '|'), post.title + post.content):
                posts.remove(post)
        if postslength == (number + 1) and len(posts) != (number + 1):
            number = number + 1 - len(posts)
            morekey = posts[-1].key()
            if string and not re.search(string.replace(' ', '|'), posts[-1].title + posts[-1].content):
                posts = posts[:(len(posts) - 1)]
            posts += getposts(number, morekey, string, type)

        return posts
    except:
        return None

def getcomments(postkey, morekey):
    try:
        if morekey:
            comment = Comment.all().order('-__key__').filter('__key__ =', morekey).get()
            query = Comment.gql('WHERE post = :post AND time = :time AND __key__ >= :key ORDER BY __key__ ASC, time ASC', post = postkey, time = comment.time, key = morekey)
            comments = query.fetch(FETCHSIZE + 1)
            if len(comments) < FETCHSIZE + 1:
                remainder = FETCHSIZE + 1 - len(comments)
                query = Comment.gql('WHERE post = :post AND time > :time ORDER BY time ASC, __key__ ASC', post = postkey, time = comment.time)
                morecomments = query.fetch(remainder)
                comments += morecomments
        else:
            query = Comment.gql('WHERE post = :post ORDER BY time ASC, __key__ ASC', post = postkey)
            comments = query.fetch(FETCHSIZE + 1)

        if len(comments) == FETCHSIZE + 1:
            morekey = comments[-1].key()
            comments = comments[:FETCHSIZE]
            comments += getcomments(postkey, morekey)
        return comments
    except:
        return None

def outputcomment(post, comments, temp, parentkey, reply):
    commenthtml = ''
    for child in comments:
        if child not in temp:
            if child.parentkey == parentkey or (not parentkey and not child.parentkey):
                temp.append(child)
                childkey = child.key().__str__()
                commenthtml += '<li class="comment" id="comment-' + childkey + '">'
                if post:
                    commenthtml += '<div class="comment-avator"><a class="comment-permalink" href="/post/' + post + '#comment-' + childkey + '"><img src="http://www.gravatar.com/avatar/'+ cgi.escape(child.email.encode('utf-8')) +'?s=48" /></a></div>'
                else:
                    commenthtml += '<div class="comment-avator"><a class="comment-permalink" href="/guestbook#comment-' + childkey + '"><img src="http://www.gravatar.com/avatar/'+ cgi.escape(child.email.encode('utf-8')) +'?s=48" /></a></div>'
                commenthtml += '<div class="comment-author">'
                if child.url:
                    commenthtml += '<a href="'+ cgi.escape(child.url.encode('utf-8')) +'">'
                if child.author:
                    commenthtml += cgi.escape(child.author.encode('utf-8'))
                else:
                    commenthtml += '匿名'
                if child.url:
                    commenthtml += '</a>'
                commenthtml += '</div>'
                commenthtml += '<div class="comment-info">'
                commenthtml += ' <a class="time">' + cgi.escape(str((child.time + timedelta(hours=+8)).strftime('%Y-%m-%d %H:%M:%S')).encode('utf-8')) + '</a>'
                commenthtml += '</div>'
                commenthtml += '<div class="comment-content">'
                commenthtml += '<pre>' + cgi.escape(child.content.encode('utf-8')) + '</pre>'
                commenthtml += '</div>'
                commenthtml += '<div class="operate">'
                if not reply or (reply and reply['key'] != childkey):
                    if post:
                        commenthtml += '<a class="reply-link" href="/post/' + post + '?reply=' + childkey + '#comment-form">回复</a>'
                    else:
                        commenthtml += '<a class="reply-link" href="/guestbook?reply=' + childkey + '#comment-form">回复</a>'
                if users.is_current_user_admin():
                    commenthtml += ' <a class="update-link" href="/update/comment?key=' + childkey + '">修改</a>'
                    commenthtml += ' <a class="delete-link" href="/delete/comment?key=' + childkey + '">删除</a>'
                #commenthtml += ' <a class="time">' + cgi.escape(str((child.time + timedelta(hours=+8)).strftime('%Y-%m-%d %H:%M:%S')).encode('utf-8')) + '</a>'
                commenthtml += '</div>'
                if reply and reply['key'] == childkey:
                    commenthtml += '<div id="comment-form">'
                    commenthtml += '<h5>回复评论</h5>'
                    commenthtml += '<form action="/add/comment" method="post">'
                    commenthtml += '<label>名称：<input type="text" name="author" id="comment-author"></label>'
                    commenthtml += '<br />'
                    commenthtml += '<label>邮箱：<input type="email" name="email" id="comment-email"></label>'
                    commenthtml += '<br />'
                    commenthtml += '<label>网址：<input type="url" name="url" id="comment-url"></label>'
                    commenthtml += '<br />'
                    commenthtml += '<label>内容：<textarea name="content" id="comment-content"></textarea></label>'
                    commenthtml += '<br />'
                    commenthtml += '<label>请输入“' + reply['captcha'] + '”的阿拉伯数字：<input type="number" name="captcha" id="comment-captcha" min="0" max="9"></label>'
                    commenthtml += '<br />'
                    commenthtml += '<input type="submit" value="提交" id="comment-submit">'
                    if post:
                        commenthtml += '<br />'
                        commenthtml += '<input type="hidden" name="post" value="' + post + '" id="comment-post">'
                    commenthtml += '<br />'
                    commenthtml += '<input type="hidden" name="parentkey" value="' + reply['key'] + '" id="comment-parentkey">'
                    commenthtml += '</form>'
                    commenthtml += '<div class="operate">'
                    if post:
                        commenthtml += '<a class="cancel-link" href="/post/' + post + '#comment-' + reply['key'] + '">取消</a>'
                    else:
                        commenthtml += '<a class="cancel-link" href="/guestbook#comment-' + reply['key'] + '">取消</a>'
                    commenthtml += '</div>'
                    commenthtml += '</div>'
                commenthtml += '<ol class="children">'
                commenthtml += outputcomment(post, comments, temp, childkey, reply)
                commenthtml += '</ol>'
                commenthtml += '</li>'
    return commenthtml

def captcha():
    captchas = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
    number = random.randint(0,9)
    memcache.set('captcha', number)
    return captchas[number]

def ismobile(self):
    user_agent = self.request.headers['User-Agent']
    if (re.search('iPod|iPhone|Android|Opera Mini|BlackBerry|webOS|UCWEB|Blazer|PSP|Symbian|IEMobile', user_agent)):
        return True
    else:
        return None

def getrecentcomments(number):
    try:
        recentcomments = memcache.get("recentcomments")
        if recentcomments is None:
            recentcomments = Comment.all().order('-time').fetch(number)
            memcache.add("recentcomments", recentcomments)
        return recentcomments
    except:
        return None

def getrecentposts(number):
    try:
        recentposts = memcache.get("recentposts")
        if recentposts is None:
            recentposts = Post.all().order('-time').fetch(number)
            memcache.add("recentposts", recentposts)
        return recentposts
    except:
        return None

class MainPage(webapp2.RequestHandler):
    def get(self, str):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            if str != '':
                if str == 'login':
                    self.redirect(users.create_login_url('/'))
                else:
                    self.redirect('/')
            else:
                q = self.request.get('q').strip()
                if q:
                    posts = memcache.get("qposts-" + q)
                    if posts is None:
                        posts = getposts(PAGESIZE, None, q, 'next')
                        memcache.add("qposts-" + q, posts)
                else:
                    posts = memcache.get("posts")
                    if posts is not None and len(posts) != PAGESIZE + 1:
                        memcache.delete("posts")
                        posts = None
                    if posts is None:
                        query = Post.gql('ORDER BY time DESC, __key__ ASC')
                        posts = query.fetch(PAGESIZE + 1)
                        memcache.add("posts", posts)

                if posts and len(posts) == PAGESIZE + 1:
                    posts = posts[:PAGESIZE]
                    next = posts[-1].key()
                else:
                    next = None

                if posts:
                    for post in posts:
                        post.content = re.sub(ur'<code(?P<index>.*)>(?P<content>[\s\S]*)</code(?P=index)>', lambda m: '<code>' + cgi.escape(m.group('content')) + '</code>', post.content)
                        post.comment = memcache.get("postcommentcount-" + post.key().__str__())
                        if post.comment is None:
                            post.comment = len(getcomments(post.key().__str__(), None))
                            memcache.add("postcommentcount-" + post.key().__str__(), post.comment)
                        post.time += timedelta(hours=+8)

                template_values = {
                    'site': site,
                    'posts': posts,
                    'previous': None,
                    'recentcomments': getrecentcomments(PAGESIZE),
                    'recentposts': getrecentposts(PAGESIZE),
                    'next': next,
                    'page': 'home'
                }

                user = users.get_current_user()
                if user:
                    template_values['logout'] = users.create_logout_url(self.request.uri)
                    template_values['user'] = users.get_current_user()
                    if users.is_current_user_admin():
                        template_values['admin'] = True
                else:
                    template_values['login'] = users.create_login_url(self.request.uri)

                if q:
                    template_values['q'] = q

                if ismobile(self):
                    template_values['mobile'] = True

                #path = os.path.join(os.path.dirname(__file__), 'template/home.html')
                self.response.out.write(render_to_string('home.html', template_values))

class ConfigPage(webapp2.RequestHandler):
    def get(self):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if users.is_current_user_admin():
            user = users.get_current_user()
            template_values = {
                'site': site,
                'user': user,
                'admin': True,
                'login': users.create_login_url(self.request.uri),
                'logout': users.create_logout_url(self.request.uri),
                'config': True
            }

            if ismobile(self):
                template_values['mobile'] = True

            #path = os.path.join(os.path.dirname(__file__), 'template/config.html')
            self.response.out.write(render_to_string('config.html', template_values))
        else:
            self.redirect(users.create_login_url(self.request.uri))
    def post(self):
        if users.is_current_user_admin():
            site = memcache.get("site")
            if site is None:
                site = Site.all().get()
                memcache.add("site", site)
            if not site:
                site = Site()
            title = self.request.get('title').strip()
            author = self.request.get('author').strip()
            email = self.request.get('email').strip()
            url = self.request.get('url').strip().rstrip("/")
            description = self.request.get('description').strip()
            if title and author and email and re.compile(r"(?:^|\s)[-a-z0-9_.]+@(?:[-a-z0-9]+\.)+[a-z]{2,6}(?:\s|$)", re.IGNORECASE).match(email) and url and re.compile('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+').match(url):
                site.title = title
                site.author = author
                site.email = email
                site.url = url
                site.description = description
                site.put()
                self.redirect('/')
            else:
                self.redirect('/config')
        else:
            self.redirect('/config')

class PreviousPage(webapp2.RequestHandler):
    def get(self, key):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            if key:
                try:
                    q = self.request.get('q').strip()
                    if q:
                        posts = memcache.get("previousqposts-" + key + q)
                        if posts is None:
                            posts = getposts(PAGESIZE, db.Key(key), q, 'previous')
                            memcache.add("previousqposts-" + key + q, posts)
                    else:
                        posts = memcache.get("previousposts-" + key)
                        if posts is None:
                            post = Post.all().order("-__key__").filter('__key__ =', db.Key(key)).get()
                            query = Post.gql('WHERE time = :time AND __key__ < :key ORDER BY __key__ DESC, time ASC', time = post.time, key = post.key())
                            posts = query.fetch(PAGESIZE + 1)
                            if len(posts) < PAGESIZE + 1:
                                remainder = PAGESIZE + 1 - len(posts)
                                query = Post.gql('WHERE time > :time ORDER BY time ASC, __key__ DESC', time = post.time)
                                moreposts = query.fetch(remainder)
                                posts += moreposts
                            memcache.add("previousposts-" + key, posts)

                    if posts:
                        next = posts[0].key()
                    else:
                        next = None
                    if len(posts) == PAGESIZE + 1:
                        posts = posts[:PAGESIZE]
                        previous = posts[-1].key()
                    else:
                        previous = None

                    for item in posts:
                        item.content = re.sub(ur'<code(?P<index>.*)>(?P<content>[\s\S]*)</code(?P=index)>', lambda m: '<code>' + cgi.escape(m.group('content')) + '</code>', item.content)
                        item.comment = len(getcomments(item.key().__str__(), None))
                        item.time += timedelta(hours=+8)
                    #posts = reversed(posts)
                    posts = posts[::-1]

                    template_values = {
                        'site': site,
                        'posts': posts,
                        'previous': previous,
                        'next': next,
                        'page': 'previous'
                    }

                    user = users.get_current_user()
                    if user:
                        template_values['logout'] = users.create_logout_url(self.request.uri)
                        template_values['user'] = users.get_current_user()
                        if users.is_current_user_admin():
                            template_values['admin'] = True
                    else:
                        template_values['login'] = users.create_login_url(self.request.uri)

                    if q:
                        template_values['q'] = q

                    if ismobile(self):
                        template_values['mobile'] = True

                    #path = os.path.join(os.path.dirname(__file__), 'template/home.html')
                    self.response.out.write(render_to_string('home.html', template_values))
                except:
                    self.redirect('/')
            else:
                self.redirect('/')

class NextPage(webapp2.RequestHandler):
    def get(self, key):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            if key:
                try:
                    q = self.request.get('q').strip()
                    if q:
                        posts = memcache.get("nextqposts-" + key + q)
                        if posts is None:
                            posts = getposts(PAGESIZE, db.Key(key), q, 'next')
                            memcache.add("nextqposts-" + key + q, posts)
                    else:
                        posts = memcache.get("nextposts-" + key)
                        if posts is None:
                            post = Post.all().order("-__key__").filter('__key__ =', db.Key(key)).get()
                            query = Post.gql('WHERE time = :time AND __key__ > :key ORDER BY __key__ ASC, time DESC', time = post.time, key = post.key())
                            posts = query.fetch(PAGESIZE + 1)
                            if len(posts) < PAGESIZE + 1:
                                remainder = PAGESIZE + 1 - len(posts)
                                query = Post.gql('WHERE time < :time ORDER BY time DESC, __key__ ASC', time = post.time)
                                moreposts = query.fetch(remainder)
                                posts += moreposts
                            memcache.add("nextposts-" + key, posts)

                    if posts:
                        previous = posts[0].key()
                    else:
                        previous = None
                    if len(posts) == PAGESIZE + 1:
                        posts = posts[:PAGESIZE]
                        next = posts[-1].key()
                    else:
                        next = None

                    for item in posts:
                        item.content = re.sub(ur'<code(?P<index>.*)>(?P<content>[\s\S]*)</code(?P=index)>', lambda m: '<code>' + cgi.escape(m.group('content')) + '</code>', item.content)
                        item.comment = len(getcomments(item.key().__str__(), None))
                        item.time += timedelta(hours=+8)

                    template_values = {
                        'site': site,
                        'posts': posts,
                        'previous': previous,
                        'next': next,
                        'page': 'next'
                    }

                    user = users.get_current_user()
                    if user:
                        template_values['logout'] = users.create_logout_url(self.request.uri)
                        template_values['user'] = users.get_current_user()
                        if users.is_current_user_admin():
                            template_values['admin'] = True
                    else:
                        template_values['login'] = users.create_login_url(self.request.uri)

                    if q:
                        template_values['q'] = q

                    if ismobile(self):
                        template_values['mobile'] = True

                    #path = os.path.join(os.path.dirname(__file__), 'template/home.html')
                    self.response.out.write(render_to_string('home.html', template_values))
                except:
                    self.redirect('/')
            else:
                self.redirect('/')

class Feed(webapp2.RequestHandler):
    def get(self):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            site.url = site.url.rstrip("/")
            posts = memcache.get("posts")
            if posts is None:
                query = Post.gql('ORDER BY time DESC, __key__ ASC')
                posts = query.fetch(PAGESIZE)
            if posts and len(posts) == PAGESIZE + 1:
                posts = posts[:PAGESIZE]
            
            for item in posts:
                item.content = re.sub(ur'<code(?P<index>.*)>(?P<content>[\s\S]*)</code(?P=index)>', lambda m: '<code>' + cgi.escape(m.group('content')) + '</code>', item.content)
                item.time += timedelta(hours=+8)

            template_values = {
                'site': site,
                'posts': posts
            }

            #path = os.path.join(os.path.dirname(__file__), 'template/feed.xml')
            self.response.headers['Content-type'] = 'application/xml;charset=UTF-8'
            self.response.out.write(render_to_string('feed.xml', template_values))

class AddPost(webapp2.RequestHandler):
    def get(self):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            if users.is_current_user_admin():
                template_values = {
                    'site': site,
                    'user': users.get_current_user(),
                    'login': users.create_login_url(self.request.uri),
                    'logout': users.create_logout_url(self.request.uri),
                    'admin': True,
                    'new': True
                }

                if ismobile(self):
                    template_values['mobile'] = True

                #path = os.path.join(os.path.dirname(__file__), 'template/newpost.html')
                self.response.out.write(render_to_string('newpost.html', template_values))
            else:
                self.redirect('/')
    def post(self):
        if users.is_current_user_admin():
            title = self.request.get('title').strip()
            content = self.request.get('content').strip()
            if content:
                post = Post()
                post.title = title
                post.content = content
                post.put()

                posts = memcache.get("posts")
                if posts is not None:
                    posts.insert(0, post)
                    posts.pop()
                    memcache.replace("posts", posts)

                recentposts = memcache.get("recentposts")
                if recentposts is not None:
                    recentposts.insert(0, post)
                    recentposts.pop()
                    memcache.replace("recentposts", recentposts)

                key = post.key().__str__()
                self.redirect('/post/' + key)
        self.redirect('/')

class DeletePost(webapp2.RequestHandler):
    def get(self):
        key = self.request.get('key')
        if users.is_current_user_admin() and key:
            try:
                post = Post.all().order("-__key__").filter('__key__ =', db.Key(key)).get()
                if post:
                    comments = getcomments(post.key().__str__(), None)
                    for item in comments:
                        item.post = None
                        item.put()
                    db.delete(post)
            except:
                self.redirect('/')
        self.redirect('/')

class UpdatePost(webapp2.RequestHandler):
    def get(self):
        key = self.request.get('key')
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            if users.is_current_user_admin() and key:
                try:
                    post = Post.all().order("-__key__").filter('__key__ =', db.Key(key)).get()
                    if post:
                        template_values = {
                            'site': site,
                            'post': post,
                            'user': users.get_current_user(),
                            'login': users.create_login_url(self.request.uri),
                            'logout': users.create_logout_url(self.request.uri),
                            'admin': True
                        }

                        if ismobile(self):
                            template_values['mobile'] = True

                        #path = os.path.join(os.path.dirname(__file__), 'template/editpost.html')
                        self.response.out.write(render_to_string('editpost.html', template_values))
                    else:
                        self.redirect('/')
                except:
                    self.redirect('/')
            else:
                self.redirect('/')
    def post(self):
        key = self.request.get('key')
        if users.is_current_user_admin() and key:
            try:
                post = Post.all().order("-__key__").filter('__key__ =', db.Key(key)).get()
                if post:
                    title = self.request.get('title').strip()
                    content = self.request.get('content').strip()
                    if content:
                        post.title = title
                        post.content = content
                        post.put()
                        mempost = memcache.get("post-" + key)
                        if mempost is not None:
                            memcache.replace("post-" + key, post)
                        memposts = memcache.get("posts")
                        if memposts is not None:
                            for item in memposts:
                                if item.key().__str__() == key:
                                    item.title = title
                                    item.content = content
                            memcache.replace("posts", memposts)
                    self.redirect('/post/' + key)
                else:
                    self.redirect('/')
            except:
                self.redirect('/')
        else:
            self.redirect('/')

class ViewPost(webapp2.RequestHandler):
    def get(self, key):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            if key:
                try:
                    post = memcache.get("post-" + key)
                    if post is None:
                        post = Post.all().order("-__key__").filter('__key__ = ', db.Key(key)).get()
                        memcache.add("post-" + key, post)
                    outputcaptcha = captcha()
                    if post and outputcaptcha:
                        template_values = {
                            'site': site,
                            'captcha': outputcaptcha,
                            'recentcomments': getrecentcomments(PAGESIZE),
                            'recentposts': getrecentposts(PAGESIZE)
                        }

                        user = users.get_current_user()
                        if user:
                            template_values['logout'] = users.create_logout_url(self.request.uri)
                            template_values['user'] = users.get_current_user()
                            if users.is_current_user_admin():
                                template_values['admin'] = True
                        else:
                            template_values['login'] = users.create_login_url(self.request.uri)

                        previouspost = memcache.get("previouspost-" + key)
                        if previouspost is None:
                            previouspost = Post.gql('WHERE time = :time AND __key__ < :key ORDER BY __key__ DESC, time ASC', time = post.time, key = post.key()).get()
                            if not previouspost:
                                previouspost = Post.gql('WHERE time > :time ORDER BY time ASC, __key__ DESC', time = post.time).get()
                            memcache.add("previouspost-" + key, previouspost)
                        if previouspost:
                            template_values['previouspost'] = previouspost

                        nextpost = memcache.get("nextpost-" + key)
                        if nextpost is None:
                            nextpost = Post.gql('WHERE time = :time AND __key__ > :key ORDER BY __key__ ASC, time DESC', time = post.time, key = post.key()).get()
                            if not nextpost:
                                nextpost = Post.gql('WHERE time < :time ORDER BY time DESC, __key__ ASC', time = post.time).get()
                            memcache.add("nextpost-" + key, nextpost)
                        if nextpost:
                            template_values['nextpost'] = nextpost

                        comments = memcache.get("comments-" + key)
                        if comments is None:
                            comments = getcomments(key, None)
                            memcache.add("comments-" + key, comments)

                        for comment in comments:
                            comment.email = hashlib.new('md5', comment.email).hexdigest()

                        template_values['commentcount'] = len(comments)

                        reply = None
                        replykey = self.request.get('reply')
                        if replykey:
                            comment = memcache.get("comment-" + replykey)
                            if comment is None:
                                comment = Comment.all().order("-__key__").filter('__key__ =', db.Key(replykey)).get()
                                memcache.add("comment-" + replykey, comment)
                            if comment and comment.post == key:
                                reply = {
                                        'key': str(replykey),
                                        'captcha': outputcaptcha
                                }
                                template_values['reply'] = True

                        commenthtml = outputcomment(key, comments, [], None, reply)
    
                        template_values['commenthtml'] = commenthtml

                        if ismobile(self):
                            template_values['mobile'] = True

                        post.content = re.sub(ur'<code(?P<index>.*)>(?P<content>[\s\S]*)</code(?P=index)>', lambda m: '<code>' + cgi.escape(m.group('content')) + '</code>', post.content)
                        post.time += timedelta(hours=+8)
                        template_values['post'] = post

                        #path = os.path.join(os.path.dirname(__file__), 'template/post.html')
                        self.response.out.write(render_to_string('post.html', template_values))
                    else:
                        self.redirect('/')
                except:
                    self.redirect('/')
            else:
                self.redirect('/')

class AddComment(webapp2.RequestHandler):
    def get(self):
        self.redirect('/')
    def post(self):
        author = self.request.get('author').strip()
        email = self.request.get('email').strip()
        url = self.request.get('url').strip()
        content = self.request.get('content').strip()
        inputcaptcha = self.request.get('captcha').strip()
        post = self.request.get('post').strip()
        parentkey = self.request.get('parentkey').strip()
        type = self.request.get('type').strip()

        currentcaptcha = memcache.get('captcha')

        if inputcaptcha and inputcaptcha == str(currentcaptcha) and content and (not email or re.compile(r"(?:^|\s)[-a-z0-9_.]+@(?:[-a-z0-9]+\.)+[a-z]{2,6}(?:\s|$)", re.IGNORECASE).match(email)) and (not url or re.compile('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+').match(url)):
            comment = Comment()
            comment.author = author
            comment.email = email
            comment.url = url
            comment.content = content

            if post:
                try:
                    commentpost = memcache.get("post-" + post)
                    if commentpost is None:
                        commentpost = Post.all().order("-__key__").filter('__key__ =', db.Key(post)).get()
                        memcache.add("post-" + post, commentpost)
                    if commentpost:
                        comment.post = post
                    else:
                        comment.post = None
                except:
                    comment.post = None
            else:
                comment.post = None

            replynoticemail = None

            if parentkey:
                try:
                    parentcomment = memcache.get("comment-" + parentkey)
                    if parentcomment is None:
                        parentcomment = Comment.all().order("-__key__").filter('__key__ =', db.Key(parentkey)).get()
                        memcache.add("comment-" + parentkey, parentcomment)
                    if parentcomment:
                        comment.parentkey = parentkey
                        replynoticemail = parentcomment.email
                    else:
                        comment.parentkey = None
                except:
                    comment.parentkey = None
            else:
                comment.parentkey = None
            comment.put()
            
            recentcomments = memcache.get("recentcomments")
            if recentcomments is not None:
                recentcomments.insert(0, comment)
                recentcomments.pop()
                memcache.replace("recentcomments", recentcomments)

            
            postcommentskey = post
            if not post:
                postcommentskey = "none"
            postcomments = memcache.get("comments-" + postcommentskey)
            if postcomments is not None:
                postcomments.append(comment)
                memcache.replace("comments-" + postcommentskey, postcomments)

            postcommentcount = memcache.get("postcommentcount-" + postcommentskey)
            if postcommentcount is not None:
                postcommentcount = postcommentcount + 1
                memcache.replace("postcommentcount-" + postcommentskey, postcommentcount)

            commentkey = comment.key().__str__()

            site = memcache.get("site")
            if site is None:
                site = Site.all().get()
                memcache.add("site", site)
            if site and replynoticemail and re.compile(r"(?:^|\s)[-a-z0-9_.]+@(?:[-a-z0-9]+\.)+[a-z]{2,6}(?:\s|$)", re.IGNORECASE).match(replynoticemail):
                replynotice = mail.EmailMessage()
                replynotice.sender = site.email
                replynotice.subject = u'%s 评论回复通知' % site.title
                replynotice.to = replynoticemail
                if not comment.author:
                    comment.author = u'匿名'
                if comment.post:
                    commenturl = site.url.rstrip("/") + '/post/' + comment.post + '#comment-' + commentkey
                else:
                    commenturl = site.url.rstrip("/") + '/guestbook' + '#comment-' + commentkey
                replynotice.body = u'''您在 %s（%s） 上的评论有了新的回复：
                %s：
                %s
                链接：
                %s
                ''' % (site.title, site.url, comment.author, comment.content, commenturl)
                replynotice.html = u'''您在 <a href="%s">%s</a> 上的评论有了新的回复：<br />
                <p><b>%s：</b>
                %s</p>
                链接：
                <a href="%s">%s</a>
                ''' % (site.url, site.title, comment.author, comment.content, commenturl, commenturl)
                replynotice.send()

            if type and type == 'ajax':
                self.response.out.write(commentkey)
            else:
                self.redirect('/post/' + post + '#comment-' + commentkey)
        else:
            if parentkey:
                self.redirect('/post/' + post + '?reply=' + parentkey + '#comment-form')
            else:
                self.redirect('/post/' + post + '#comment-form')

class DeleteComment(webapp2.RequestHandler):
    def get(self):
        key = self.request.get('key')
        if users.is_current_user_admin() and key:
            try:
                comment = Comment.all().order("-__key__").filter('__key__ =', db.Key(key)).get()
                if comment:
                    post = comment.post
                    children = getcomments(post, None)
                    for item in children:
                        if str(item.parentkey) == comment.key().__str__():
                            if comment.parentkey:
                                item.parentkey = comment.parentkey
                            else:
                                item.parentkey = None
                            item.put()
                    db.delete(comment)
                    memcache.delete("recentcomments")
            except:
                self.redirect('/')
        self.redirect('/')

class UpdateComment(webapp2.RequestHandler):
    def get(self):
        key = self.request.get('key')
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            if users.is_current_user_admin() and key:
                try:
                    comment = Comment.all().order("-__key__").filter('__key__ =', db.Key(key)).get()
                    if comment:
                        template_values = {
                            'site': site,
                            'comment': comment,
                            'user': users.get_current_user(),
                            'admin': True,
                            'login': users.create_login_url(self.request.uri),
                            'logout': users.create_logout_url(self.request.uri)
                        }

                        if ismobile(self):
                            template_values['mobile'] = True

                        #path = os.path.join(os.path.dirname(__file__), 'template/editcomment.html')
                        self.response.out.write(render_to_string('editcomment.html', template_values))
                    else:
                        self.redirect('/')
                except:
                    self.redirect('/')
            else:
                self.redirect('/')
    def post(self):
        key = self.request.get('key')
        if users.is_current_user_admin() and key:
            try:
                comment = Comment.all().order("-__key__").filter('__key__ =', db.Key(key)).get()
                if comment:
                    author = self.request.get('author').strip()
                    email = self.request.get('email').strip()
                    url = self.request.get('url').strip()
                    content = self.request.get('content').strip()
                    if content and (not email or re.compile(r"(?:^|\s)[-a-z0-9_.]+@(?:[-a-z0-9]+\.)+[a-z]{2,6}(?:\s|$)", re.IGNORECASE).match(email)) and (not url or re.compile('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+').match(url)):
                        comment.author = author
                        comment.email = email
                        comment.url = url
                        comment.content = content
                        comment.put()
                    self.redirect('/post/' + comment.post + '#comment-' + key)
                else:
                    self.redirect('/')
            except:
                self.redirect('/')
        else:
            self.redirect('/')

class AboutPage(webapp2.RequestHandler):
    def get(self):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            template_values = {
                'site': site,
                'page': 'about',
                'recentcomments': getrecentcomments(PAGESIZE),
                'recentposts': getrecentposts(PAGESIZE)
            }

            user = users.get_current_user()
            if user:
                template_values['logout'] = users.create_logout_url(self.request.uri)
                template_values['user'] = users.get_current_user()
                if users.is_current_user_admin():
                    template_values['admin'] = True
            else:
                template_values['login'] = users.create_login_url(self.request.uri)

            if ismobile(self):
                template_values['mobile'] = True

            #path = os.path.join(os.path.dirname(__file__), 'template/about.html')
            self.response.out.write(render_to_string('about.html', template_values))

class GuestbookPage(webapp2.RequestHandler):
    def get(self):
        site = memcache.get("site")
        if site is None:
            site = Site.all().get()
            memcache.add("site", site)
        if not site:
            self.redirect('/config')
        else:
            try:
                outputcaptcha = captcha()
                if outputcaptcha:
                    template_values = {
                        'site': site,
                        'captcha': outputcaptcha,
                        'page': 'guestbook',
                        'recentcomments': getrecentcomments(PAGESIZE),
                        'recentposts': getrecentposts(PAGESIZE)
                    }

                    user = users.get_current_user()
                    if user:
                        template_values['logout'] = users.create_logout_url(self.request.uri)
                        template_values['user'] = users.get_current_user()
                        if users.is_current_user_admin():
                            template_values['admin'] = True
                    else:
                        template_values['login'] = users.create_login_url(self.request.uri)

                    comments = memcache.get("comments-none")
                    if comments is None:
                        comments = getcomments(None, None)
                        memcache.add("comments-none", comments)

                    for comment in comments:
                        comment.email = hashlib.new('md5', comment.email).hexdigest()

                    template_values['commentcount'] = len(comments)

                    reply = None
                    replykey = self.request.get('reply')
                    if replykey:
                        comment = memcache.get("comment-" + replykey)
                        if comment is None:
                            comment = Comment.all().order("-__key__").filter('__key__ =', db.Key(replykey)).get()
                            memcache.add("comment-" + replykey, comment)
                        if comment and comment.post == None:
                            reply = {
                                    'key': str(replykey),
                                    'captcha': outputcaptcha
                            }
                            template_values['reply'] = True

                    commenthtml = outputcomment(None, comments, [], None, reply)

                    template_values['commenthtml'] = commenthtml

                    if ismobile(self):
                        template_values['mobile'] = True

                    #path = os.path.join(os.path.dirname(__file__), 'template/guestbook.html')
                    self.response.out.write(render_to_string('guestbook.html', template_values))
                else:
                    self.redirect('/')
            except:
                self.redirect('/')

class Love(webapp2.RequestHandler):
    def get(self):
        if self.request.get('login'):
            if self.request.get('login') == 'qq':
                self.redirect('https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=100538789&redirect_uri=http://www.sadpast.com/love')
            if self.request.get('login') == 'logout':
                self.response.headers.add_header('Set-Cookie', 'love_access_token=""; expires=' + datetime.datetime.now().strftime("%a, %d-%b-%Y %H:%M:%S GMT") + '; path=/love')
                
                self.response.headers.add_header('Set-Cookie', 'love_ui_nickname=""; expires=' + datetime.datetime.now().strftime("%a, %d-%b-%Y %H:%M:%S GMT") + '; path=/love')
                self.response.headers.add_header('Set-Cookie', 'love_ui_figureurl_qq_1=""; expires=' + datetime.datetime.now().strftime("%a, %d-%b-%Y %H:%M:%S GMT") + '; path=/love')
                self.redirect('/love')
        else:
            template_values = {}
            user_info = None
            if self.request.cookies and self.request.cookies.get('love_ui_nickname') and self.request.cookies.get('love_ui_figureurl_qq_1'):
                user_info = {
                    'nickname': self.request.cookies.get('love_ui_nickname'),
                    'figureurl_qq_1': self.request.cookies.get('love_ui_figureurl_qq_1')
                }
            else:
                if self.request.cookies and self.request.cookies.get('love_access_token'):
                    access_token = self.request.cookies.get('love_access_token')
                    openid = str(urllib2.urlopen('https://graph.qq.com/oauth2.0/me?access_token=' + access_token).read().split('"openid":"')[1].split('"')[0])
                    if openid:
                        user_info = str(urllib2.urlopen('https://graph.qq.com/user/get_user_info?access_token=' + access_token + '&oauth_consumer_key=100538789&openid=' + openid).read()).strip()
                        user_info = json.loads(user_info)
                        self.response.headers.add_header('Set-Cookie', 'love_ui_nickname=' + str(user_info['nickname'].strip()) + '; expires=' + (datetime.datetime.now() + datetime.timedelta(days=365)).strftime("%a, %d-%b-%Y %H:%M:%S GMT") + '; path=/love')
                        self.response.headers.add_header('Set-Cookie', 'love_ui_figureurl_qq_1=' + str(user_info['figureurl_qq_1'].strip()) + '; expires=' + (datetime.datetime.now() + datetime.timedelta(days=365)).strftime("%a, %d-%b-%Y %H:%M:%S GMT") + '; path=/love')
                if self.request.get('code'):
                    access_token = str(urllib2.urlopen('https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=100538789&client_secret=154e93feacc61091f2d3dbe8543dda35&code=' + self.request.get('code').strip() + '&redirect_uri=http://www.sadpast.com/love').read().split('&')[0].split('access_token=')[1]).strip()
                    self.response.headers.add_header('Set-Cookie', 'love_access_token=' + access_token + '; expires=' + (datetime.datetime.now() + datetime.timedelta(days=30)).strftime("%a, %d-%b-%Y %H:%M:%S GMT") + '; path=/love')
                    self.redirect('/love')
            template_values['user_info'] = user_info
            self.response.out.write(render_to_string('love.html', template_values))
    def post(self):
        self.redirect('/love')


app = webapp2.WSGIApplication([
    ('/add/post', AddPost),
    ('/delete/post', DeletePost),
    ('/update/post', UpdatePost),
    ('/add/comment', AddComment),
    ('/delete/comment', DeleteComment),
    ('/update/comment', UpdateComment),
    ('/post/(.*)', ViewPost),
    ('/feed', Feed),
    ('/previous/(.*)', PreviousPage),
    ('/next/(.*)', NextPage),
    ('/config', ConfigPage),
    ('/about', AboutPage),
    ('/guestbook', GuestbookPage),
    ('/love', Love),
    ('/(.*)', MainPage)
], debug=True)
