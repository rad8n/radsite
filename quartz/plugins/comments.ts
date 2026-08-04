import { QuartzPlugin } from "./types"
import { Comments } from "../components"

export const CommentsPlugin: QuartzPlugin = () => {
  return {
    name: "Comments",

    components: {
      afterBody: Comments,
    },
  }
}