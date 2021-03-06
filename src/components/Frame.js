import React, { Component, PropTypes } from 'react'
import { findDOMNode } from 'react-dom'
import computeNodeWidth from '../utils/computeNodeWidth'
import DefaultInspector from './Inspector'
import DefaultLink from './Link'
import DefaultNode from './Node'
import defaultTheme from './theme'
import ignoreEvent from '../utils/ignoreEvent'

import xOfPin from '../utils/xOfPin'
import Selector from './Selector'

const getTime = () => (new Date() / 1)

class Frame extends Component {
  constructor (props) {
    super(props)

    this.state = {
      draggedLinkId: null,
      draggedItems: [],
      pointer: null,
      showSelector: false,
      selectedItems: [],
      whenUpdated: getTime() // this attribute is used to force React render.
    }
  }

  componentDidMount () {
    const container = findDOMNode(this).parentNode

    const offset = {
      x: container.offsetLeft,
      y: container.offsetTop
    }

    this.setState({ offset })
  }

  render () {
    const {
      createInputPin,
      createOutputPin,
      createLink,
      createNode,
      deleteLink,
      deleteInputPin,
      deleteNode,
      deleteOutputPin,
      dragItems,
      fontFamily,
      fontSize,
      item,
      lineWidth,
      model,
      nodeBodyHeight,
      pinSize,
      renameNode,
      style,
      updateLink,
      view
    } = this.props

    const {
      draggedItems,
      draggedLinkId,
      offset,
      pointer,
      selectedItems,
      showSelector
    } = this.state

    const height = view.height
    const width = view.width

    const typeOfNode = item.util.typeOfNode

    const Inspector = item.inspector.DefaultInspector
    const Link = item.link.DefaultLink

    const setState = this.setState.bind(this)

    const getCoordinates = (e) => ({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    })

    const onClick = (e) => {
      e.preventDefault()
      e.stopPropagation()

      setState({ showSelector: false })
    }

    const onCreateLink = (link) => {
      const draggedLinkId = createLink(link)

      setState({ draggedLinkId })
    }

    const onUpdateLink = (id, link) => {
      updateLink(id, link)

      const disconnectingLink = (link.to === null)

      if (disconnectingLink) {
        link.id = id

        setState({ draggedLinkId: id })
      } else {
        setState({ draggedLinkId: null })
      }
    }

    const onDoubleClick = (e) => {
      e.preventDefault()
      e.stopPropagation()

      setState({
        pointer: getCoordinates(e),
        showSelector: true
      })
    }

    const onMouseDown = (e) => {
      e.preventDefault()
      e.stopPropagation()

      // TODO Shift key for multiple selection.

      setState({
        selectedItems: []
      })
    }

    const onMouseLeave = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const draggedLinkId = this.state.draggedLinkId
      if (draggedLinkId) deleteLink(draggedLinkId)

      setState({
        draggedItems: [],
        draggedLinkId: null,
        pointer: null,
        showSelector: false
      })
    }

    const onMouseMove = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const nextPointer = getCoordinates(e)

      setState({
        pointer: nextPointer
      })

      const draggedItems = this.state.draggedItems

      if (draggedItems.length > 0) {
        const draggingDelta = {
          x: (pointer ? nextPointer.x - pointer.x : 0),
          y: (pointer ? nextPointer.y - pointer.y : 0)
        }

        dragItems(draggingDelta, draggedItems)
      }
    }

    const onMouseUp = (e) => {
      e.preventDefault()
      e.stopPropagation()

      const draggedLinkId = this.state.draggedLinkId

      if (draggedLinkId) {
        deleteLink(draggedLinkId)

        setState({
          draggedLinkId: null,
          pointer: null
        })
      } else {
        setState({
          draggedItems: [],
          selectedItems: [],
          pointer: null
        })
      }
    }

    /**
     * Bring up selected nodes.
     */

    const selectedFirst = (a, b) => {
      // FIXME it works, but it would be nice if the selected
      // items keep being up after deselection.
      const aIsSelected = (selectedItems.indexOf(a) > -1)
      const bIsSelected = (selectedItems.indexOf(b) > -1)

      if (aIsSelected && bIsSelected) return 0

      if (aIsSelected) return 1
      if (bIsSelected) return -1
    }

    const selectItem = (id) => (e) => {
      e.preventDefault()
      e.stopPropagation()

      // Do not select items when releasing a dragging link.

      const draggedLinkId = this.state.draggedLinkId

      if (draggedLinkId) {
        deleteLink(draggedLinkId)

        setState({
          draggedLinkId: null
        })

        return
      }

      var selectedItems = Object.assign([], this.state.selectedItems)

      const index = selectedItems.indexOf(id)

      if (index === -1) {
        // Shift key allows multiple selection.
        if (e.shiftKey) {
          // TODO it does not work.
          selectedItems.push(id)
        } else {
          selectedItems = [id]
        }
      } else {
        selectedItems.splice(index, 1)
      }

      setState({
        draggedItems: [],
        selectedItems
      })
    }

    const startDraggingLink = (id) => {
      delete view.link[id].to

      setState({ draggedLinkId: id })
    }

    const willDragItem = (id) => (e) => {
      e.preventDefault()
      e.stopPropagation()

      var draggedItems = Object.assign([], this.state.draggedItems)

      const index = draggedItems.indexOf(id)

      if (index === -1) {
        // Shift key allows multiple selection.
        if (e.shiftKey) {
          // TODO it does not work.
          draggedItems.push(id)
        } else {
          draggedItems = [id]
        }
      }

      setState({
        draggedItems,
        selectedItems: []
      })
    }

    return (
      <svg
        fontFamily={fontFamily}
        fontSize={fontSize}
        height={height}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        onMouseEnter={ignoreEvent}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        textAnchor='start'
        style={style}
        width={width}
      >
        {Object.keys(view.node).sort(selectedFirst).map((id, i) => {
          const node = view.node[id]

          const {
            height,
            ins,
            outs,
            text,
            width,
            x,
            y
          } = node

          const nodeType = typeOfNode(node)
          const Node = item.node[nodeType]

          return (
            <Node
              key={i}
              dragged={(draggedItems.indexOf(id) > -1)}
              draggedLinkId={draggedLinkId}
              fontSize={fontSize}
              height={height}
              id={id}
              ins={ins}
              model={model}
              onCreateLink={onCreateLink}
              outs={outs}
              pinSize={pinSize}
              selected={(selectedItems.indexOf(id) > -1)}
              selectNode={selectItem(id)}
              text={text}
              updateLink={onUpdateLink}
              width={width}
              willDragNode={willDragItem(id)}
              x={x}
              y={y}
            />
          )
        })}
        {Object.keys(view.link).map((id, i) => {
          const {
            from,
            to
          } = view.link[id]

          var x1 = null
          var y1 = null
          var x2 = null
          var y2 = null

          const nodeIds = Object.keys(view.node)
          const idEquals = (x) => (id) => (id === x[0])
          const sourceId = (from ? nodeIds.find(idEquals(from)) : null)
          const targetId = (to ? nodeIds.find(idEquals(to)) : null)

          var computedWidth = null

          if (sourceId) {
            const source = view.node[sourceId]

            computedWidth = computeNodeWidth({
              bodyHeight: nodeBodyHeight, // TODO custom nodes height
              pinSize,
              fontSize,
              node: source
            })

            x1 = source.x + xOfPin(pinSize, computedWidth, source.outs.length, from[1])
            y1 = source.y + pinSize + nodeBodyHeight
          }

          if (targetId) {
            const target = view.node[targetId]

            computedWidth = computeNodeWidth({
              bodyHeight: nodeBodyHeight, // TODO custom nodes height
              pinSize,
              fontSize,
              node: target
            })

            x2 = target.x + xOfPin(pinSize, computedWidth, target.ins.length, to[1])
            y2 = target.y
          } else {
            // FIXME at first, pointer is null. This trick works, but,
            // it should be reviosioned when implementing creating links
            // in the opposite direction.
            x2 = pointer ? (pointer.x - pinSize / 2) : x1
            y2 = pointer ? (pointer.y - pinSize) : y1
          }

          return (
            <Link
              key={i}
              from={from}
              lineWidth={lineWidth}
              id={id}
              onCreateLink={onCreateLink}
              startDraggingLink={startDraggingLink}
              pinSize={pinSize}
              selected={(selectedItems.indexOf(id) > -1)}
              selectLink={selectItem(id)}
              to={to}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
            />
          )
        })}
        <Inspector
          createInputPin={createInputPin}
          createOutputPin={createOutputPin}
          deleteLink={deleteLink}
          deleteNode={deleteNode}
          deleteInputPin={deleteInputPin}
          deleteOutputPin={deleteOutputPin}
          items={(Object.assign([], selectedItems, draggedItems))}
          renameNode={(nodeId, text) => {
            renameNode(nodeId, text)

            setState({ whenUpdated: getTime() })
          }}
          view={view}
        />
        <Selector
          createNode={(node) => {
            const id = createNode(node)

            setState({
              selectedItems: [id],
              showSelector: false,
              whenUpdated: getTime()
            })
          }}
          pointer={pointer}
          show={showSelector}
        />
      </svg>
    )
  }
}

Frame.propTypes = {
  createInputPin: PropTypes.func.isRequired,
  createOutputPin: PropTypes.func.isRequired,
  createLink: PropTypes.func.isRequired,
  createNode: PropTypes.func.isRequired,
  deleteLink: PropTypes.func.isRequired,
  deleteInputPin: PropTypes.func.isRequired,
  deleteNode: PropTypes.func.isRequired,
  deleteOutputPin: PropTypes.func.isRequired,
  dragItems: PropTypes.func.isRequired,
  fontFamily: PropTypes.string.isRequired,
  fontSize: PropTypes.number.isRequired,
  item: PropTypes.shape({
    inspector: PropTypes.object.isRequired,
    link: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    util: PropTypes.shape({
      typeOfNode: PropTypes.func.isRequired
    })
  }).isRequired,
  lineWidth: PropTypes.number.isRequired,
  nodeBodyHeight: PropTypes.number.isRequired,
  pinSize: PropTypes.number.isRequired,
  renameNode: PropTypes.func.isRequired,
  style: PropTypes.object.isRequired,
  updateLink: PropTypes.func.isRequired,
  view: PropTypes.shape({
    height: PropTypes.number.isRequired,
    link: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired,
    width: PropTypes.number.isRequired
  }).isRequired
}

Frame.defaultProps = {
  createInputPin: Function.prototype,
  createOutputPin: Function.prototype,
  createLink: Function.prototype,
  createNode: Function.prototype,
  deleteLink: Function.prototype,
  deleteInputPin: Function.prototype,
  deleteNode: Function.prototype,
  deleteOutputPin: Function.prototype,
  dragItems: Function.prototype,
  fontFamily: defaultTheme.fontFamily,
  fontSize: 17, // FIXME fontSize seems to be ignored
  item: {
    inspector: { DefaultInspector },
    link: { DefaultLink },
    node: { DefaultNode },
    util: {
      typeOfNode: function (node) { return 'DefaultNode' }
    }
  },
  lineWidth: defaultTheme.lineWidth,
  nodeBodyHeight: defaultTheme.nodeBodyHeight,
  pinSize: defaultTheme.pinSize,
  renameNode: Function.prototype,
  style: { border: '1px solid black' },
  updateLink: Function.prototype,
  view: {
    height: 400,
    link: {},
    node: {},
    width: 400
  }
}

export default Frame
