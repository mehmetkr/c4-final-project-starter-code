import * as React from 'react'
import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }



  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const functionInput = this.state.newTodoName

      const [expression, rangeStart, rangeEnd] = functionInput.split(',');

      // Parse numerical values
      const start = parseFloat(rangeStart.trim());
      const end = parseFloat(rangeEnd.trim());

      // Calculate x and y values
      const xValues = [];
      const yValues = [];
      const interval = (end - start) / 100;

      for (let x = start; x <= end; x += interval) {
        const y = eval(expression);
        xValues.push(x);
        yValues.push(-y);
      }

      // Draw the graph
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context is not available.');
      }

      canvas.width = 1500;
      canvas.height = 1000;

      this.drawGraph(context, xValues, yValues);

      const idToken = this.props.auth.getIdToken()

      // Save the graph as a JPG file
      this.saveGraphAsJpg(canvas, idToken);

      const dataUrl = canvas.toDataURL('image/jpeg');

      // Generate base64 string of the graph image
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    
      // Convert base64 string to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      
      const newTodo = await createTodo(idToken, {
        name: this.state.newTodoName,
        dueDate,
        graphBuffer: buffer
      })
    
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })

    } catch (e) {
      alert(`Failed to create the function: ${(e as Error).message}`)
    }
  }


  
  drawGraph = (
    context: CanvasRenderingContext2D,
    xValues: number[],
    yValues: number[]
  ) => {

    const canvasWidth = context.canvas.width;
    const canvasHeight = context.canvas.height;

    // Clear the canvas
    context.clearRect(0, 0, canvasWidth, canvasHeight);

  // Set up graph dimensions
  const graphWidth = canvasWidth - 80; // Adjust as needed
  const graphHeight = canvasHeight - 80; // Adjust as needed

  // Find the minimum and maximum values for x and y
  const minX = Math.min(0, ...xValues);
  const maxX = Math.max(0, ...xValues);
  const minY = Math.min(0, ...yValues);
  const maxY = Math.max(0, ...yValues);

  // Calculate the origin point
  // const originX = Math.abs(minX) * (graphWidth / (maxX - minX)) + 40;
  // const originY = canvasHeight - Math.abs(minY) * (graphHeight / (maxY - minY)) - 40;

  const padding = 2;
  const scaleX = (canvasWidth - padding * 2) / (maxX - minX);
  const scaleY = (canvasHeight - padding * 2) / (maxY - minY);

  const originX = this.scaleX(0, minX, scaleX, padding);
  const originY = this.scaleY(0, minY, scaleY, padding);

  // Draw x-axis
  context.beginPath();
  context.moveTo(0, originY);
  context.lineTo(canvasWidth, originY);
  context.strokeStyle = '#FFFFFF'; // White color
  context.stroke();

  // Draw y-axis
  context.beginPath();
  context.moveTo(originX, 0);
  context.lineTo(originX, canvasHeight);
  context.strokeStyle = '#FFFFFF'; // White color
  context.stroke();

  // Draw x-axis tick marks
  const xTickInterval = graphWidth / 10; // Adjust as needed
  const xTickLength = 8; // Adjust as needed
  const xTickStartY = originY + xTickLength / 2; // Adjust as needed
  const xTickEndY = originY - xTickLength / 2; // Adjust as needed

  const xTickShift = originX - Math.floor(originX / xTickInterval) * xTickInterval

  for (let i = 0; i <= 10; i++) {
    const xTickX = i * xTickInterval + xTickShift;
    const xTickValue = minX + (i * (maxX - minX)) / 10;

    context.beginPath();
    context.moveTo(xTickX, xTickStartY);
    context.lineTo(xTickX, xTickEndY);
    context.strokeStyle = '#FFFFFF'; // White color
    context.stroke();

    // Draw tick label
    context.fillStyle = '#FFFFFF'; // White color
    context.textAlign = 'center';
    context.fillText(xTickValue.toFixed(1), xTickX, originY + 20); // Adjust label position as needed
  }

  // Draw y-axis tick marks
  const yTickInterval = graphHeight / 10; // Adjust as needed
  const yTickLength = 8; // Adjust as needed
  const yTickStartX = originX - yTickLength / 2; // Adjust as needed
  const yTickEndX = originX + yTickLength / 2; // Adjust as needed

  for (let i = 0; i <= 10; i++) {
    const yTickY = i * yTickInterval;
    const yTickValue = - minY - (i * (maxY - minY)) / 10;

    context.beginPath();
    context.moveTo(yTickStartX, yTickY);
    context.lineTo(yTickEndX, yTickY);
    context.strokeStyle = '#FFFFFF'; // White color
    context.stroke();

    context.fillStyle = '#FFFFFF'; // White color
    context.textAlign = 'center';
    context.fillText(yTickValue.toFixed(1), originX + 20, yTickY); // Adjust label position as needed
  }
  
    // Draw the graph
    context.beginPath();
    context.moveTo(this.scaleX(xValues[0], minX, scaleX, padding), this.scaleY(yValues[0], minY, scaleY, padding));
  
    for (let i = 1; i < xValues.length; i++) {
      const x = this.scaleX(xValues[i], minX, scaleX, padding);
      const y = this.scaleY(yValues[i], minY, scaleY, padding);
      context.lineTo(x, y);
    }
  
    context.strokeStyle = 'blue';
    context.lineWidth = 2;
    context.stroke();
  };
  
  scaleX = (value: number, minX: number, scaleX: number, padding: number) => {
    return (value - minX) * scaleX + padding;
  };
  
  scaleY = (value: number, minY: number, scaleY: number, padding: number) => {
    return (value - minY) * scaleY + padding;
  };
  


  saveGraphAsJpg = (canvas: HTMLCanvasElement, id: String) => {
    const dataUrl = canvas.toDataURL('image/jpeg');
  
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = id.toString().substring(0, 8) + ".jpg";
  
    // Simulate a click on the link to trigger the download
    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  };


  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch functions: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Functions</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'Enter a new function in terms of x and the range of x',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Functions
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos?.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
