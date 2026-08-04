import { QuartzComponent, QuartzComponentConstructor } from "./types"
import Content from "./pages/Content"
import Comments from "./Comments"

const ContentWithComments: QuartzComponent = (props) => {
  return (
    <>
      <Content {...props} />
      <Comments {...props} />
    </>
  )
}

export default (() => ContentWithComments) satisfies QuartzComponentConstructor