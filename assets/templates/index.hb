
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}} $$ grant@rules:~/</title>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type">
    <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">

    <link href="https://fonts.googleapis.com/css?family=Bangers|Oswald:300,400" rel="stylesheet">
    <script language="javascript">
    console.log("you would you to play boggle? type yes()");
        var _ = {
            yes:() => { _.boggle(); },
            reset:() => {
                yes = _.yes
            },
            boggle:() => {
                var rand = (len) => {
                    var str = [];
                    while(str.length<len){
                        str = [...str, String.fromCharCode((Math.random() * 26|0) + 65 )]
                    }
                    return str;
                }

                var prettyprint = (boggle) => {
                     var sqrt = Math.sqrt(boggle.length)|0
                     for (var i = 0;i<boggle.length;i+=sqrt) {
                         console.log(boggle.slice(i,i+sqrt).join(' '))
                     }
                }

                var boggle = rand(25);
                prettyprint(boggle);
                
            }
        }
        var yes = _.yes;
        </script>

    <style type="text/css">
    a:link {color: #red;}
a:visited {color: rgb(185,0,0);}
a:active {color: red; text-decoration: underline;}
a:hover {background-color: #ccc;}
a {text-decoration: none;}
    a {
        color: red;
    }
    a:vlink {
        color: rgb(185,0,0);
    }
        body {
            font-family: 'Oswald', sans-serif;
            margin: 0;
            padding: 0;
        }
        h1,h2,h3,h4 {
            font-family: 'Bangers', cursive;
            font-weight: normal;
        }
        #holyshit h1 {
          font-size: 100px;
          padding: 0;
          margin: 0;
        }
        #holyshit h2 {
            text-align: justify;
            margin: 0;
        }
        #holyshit {
          transform:translate(-50%, -50%);
          position: absolute;
          left: 50%;
          top: 50%;
        }
        header {
          width: 100%;
          height: 100vh;
          background-color: red;
          box-shadow: 0 3px 10px 0 rgba(0,0,0,0.36);
        }
        main, footer {
            padding: 15px 20%;
        }

        footer {
            font-weight: 300;
            box-shadow: 0 -3px 10px 0 rgba(0,0,0,0.16);
            margin-top: 100px;
            background-color: #eee;
        }
         #holyshit {
background-image: url("https://i.imgur.com/uJduofO.png");
background-size: 90px auto;
background-position: right 8px;
background-repeat: no-repeat;
                    }
        </style>
  </head>
  <body>
    <header>
        <section id="holyshit">
            <h1>Grant <div>Harding</div></h1>
            <h2>Developer &bull; Mountain Biker &bull; Fun Guy</h2>
        </section>

  </header>
  <main>
  <h1>Who am I?</h1>
  <p>I'm Grant. I'm a web developer who focuses on Javascript and Python with an extensive knowledge of Linux. My hobbies include mountain biking, hiking, board games, and playing the piano</p>
  <h1>Projects</h1>
  <h2><a href="http://careers.bike">Careers.bike</a></h2>
  <p>Careers.bike is a job aggregator and job listing site built in Javascript. Node, Express, and Mongo on the backend provide a REST API to React on the frontend. It utilizes AWS for image handling, while authentication and authorization is provided by OAuth2 and JWT.</p> 
  <h1>Articles</h1>
{{#each indexList}}
<h2><a href="{{url}}">{{title}}</a></h2>
<p>{{shortdesc}}</p>
{{/each}}
</main>

<footer>
This website was built with markdown, handlebars, and gulp. You can <a href="https://github.com/grantrules/articles">see it on GitHub</a>. I wasted time on this rather than using Jekyll or gulp-static-pages, it seemed like fun.
</footer>
  </body>
</html>
