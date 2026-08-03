<div class="comments-pixel">

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
        required
      ></textarea>

      <button class="comment-button" type="submit">
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


</div>


<script>

const worker =
"https://radsite-comments.aidankharris.workers.dev"


const page =
window.location.pathname



async function loadComments(){

  const response =
    await fetch(
      `${worker}?page=${encodeURIComponent(page)}`
    )


  const comments =
    await response.json()


  const container =
    document.getElementById("comment-list")


  if (!comments.length){

    container.innerHTML =
      "<div class='empty-comment'>NO COMMENTS YET...</div>"

    return

  }


  container.innerHTML =
    comments.map(comment => `

      <div class="pixel-comment">

        <div class="comment-user">
          ▸ ${comment.name}
        </div>

        <div class="comment-text">
          ${comment.message}
        </div>

      </div>

    `).join("")

}



document
.getElementById("comment-form")
.addEventListener(
"submit",
async (event)=>{

  event.preventDefault()


  const button =
    event.target.querySelector("button")


  button.innerHTML =
    "POSTING..."


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

        page

      })

    }
  )


  event.target.reset()


  button.innerHTML =
    "POST →"


  loadComments()

})



loadComments()

</script>