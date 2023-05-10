import { Chart, ChartConfiguration, LineController, LineElement, PointElement, LinearScale, Title } from 'chart.js';
import * as React from 'react'
import dateFormat from 'dateformat'
import { Line } from 'react-chartjs-2';
import { History } from 'history'
import update from 'immutability-helper'
import html2canvas from 'html2canvas';
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
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })


      const [expression, rangeStart, rangeEnd] = newTodo.name.split(',');

      // Parse numerical values
      const start = parseFloat(rangeStart.trim());
      const end = parseFloat(rangeEnd.trim());

      // Calculate x and y values
      const xValues = [];
      const yValues = [];
      const interval = (end - start) / 100;

      for (let x = start; x <= end; x += interval) {
        const y = eval(expression.replace(/x/g, String(x)));
        xValues.push(x);
        yValues.push(y);
      }

    // Draw the graph
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas context is not available.');
    }

    this.drawGraph(context, xValues, yValues);

    // Save the graph as a JPG file
    this.saveGraphAsJpg(canvas);



    
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
      

    } catch {
      alert('Todo creation failed')
    }
  }


  
  drawGraph = (
    context: CanvasRenderingContext2D,
    xValues: number[],
    yValues: number[]
  ) => {
    // Clear the canvas
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  
    // Set up the coordinate system
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const canvasWidth = context.canvas.width;
    const canvasHeight = context.canvas.height;
    const padding = 10;
    const scaleX = (canvasWidth - padding * 2) / (maxX - minX);
    const scaleY = (canvasHeight - padding * 2) / (maxY - minY);
  
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
  


  saveGraphAsJpg = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/jpeg');
  
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'graph.jpg';
  
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
      alert(`Failed to fetch todos: ${(e as Error).message}`)
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
              content: 'New function',
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
          Loading TODOs
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
