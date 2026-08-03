import { QuartzComponent, QuartzComponentConstructor } from "./types"

const Comments: QuartzComponent = () => {

  return (
    <section class="comments-pixel">

      <div class="comment-box">

        <div class="comment-title">
          ✦ LEAVE A COMMENT
        </div>

        <form id="comment-form">

          <input
            id="comment-name"
            class="comment-input"
            placeholder="NAME..."
          />

          <textarea
            id="comment-message"
            class="comment-input comment-area"
            placeholder="WRITE SOMETHING..."
          />

          <button class="comment-button">
            POST →
          </button>

        </form>

      </div>


      <div class="comment-list-box">

        <div class="comment-title">
          ✦ COMMENTS
        </div>

        <div id="comment-list">
          LOADING...
        </div>

      </div>

    </section>
  )
}


Comments.afterDOMLoaded = `

const worker =
"https://radsite-comments.aidankharris.workers.dev"


function loadComments(){

  const page =
  window.location.pathname


  fetch(
    worker + "?page=" + encodeURIComponent(page)
  )

  .then(r => r.json())

  .then(comments => {

    const box =
    document.getElementById("comment-list")


    if(!comments.length){

      box.innerHTML =
      "NO COMMENTS YET..."

      return

    }


    box.innerHTML =
    comments.map(c => \`

      <div class="pixel-comment">

        <div class="comment-user">
          ▸ \${c.name}
        </div>

        <div class="comment-text">
          \${c.message}
        </div>

      </div>

    \`).join("")

  })

}



document.addEventListener("nav", () => {


const form =
document.getElementById("comment-form")


if(!form) return



form.onsubmit = async (e)=>{

e.preventDefault()


await fetch(
worker,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

name:
document.getElementById("comment-name").value,

message:
document.getElementById("comment-message").value,

page:
window.location.pathname

})

})


form.reset()

loadComments()

}


loadComments()


})

`

Comments.css = `

.comments-pixel {

margin-top:3rem;

font-family:
"IBM Plex Mono",
monospace;

}


.comment-box,
.comment-list-box {

border:2px solid var(--gray);

padding:1rem;

margin-bottom:1.5rem;

background:
rgba(0,0,0,.12);

box-shadow:
4px 4px 0 rgba(0,0,0,.25);

}


.comment-title {

font-weight:bold;

letter-spacing:2px;

margin-bottom:1rem;

}


.comment-input {

width:100%;

box-sizing:border-box;

padding:.75rem;

margin-bottom:.75rem;

background:transparent;

border:2px solid var(--gray);

color:var(--dark);

font-family:inherit;

}


.comment-area {

min-height:120px;

}


.comment-button {

font-family:inherit;

padding:.6rem 1.5rem;

border:2px solid var(--gray);

background:transparent;

cursor:pointer;

}


.comment-button:hover {

transform:
translate(-2px,-2px);

}


.pixel-comment {

border-left:
3px solid var(--secondary);

padding-left:1rem;

margin-bottom:1rem;

}


.comment-user {

font-weight:bold;

}

`
 

export default (() => Comments) satisfies QuartzComponentConstructor