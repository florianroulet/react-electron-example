import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const Store = require('electron-store');
const store = new Store();

class Square extends React.Component {
    render() {
        let classes = "square " + this.props.bgColor;
        return (
            <button
                className={classes}
                onClick={this.props.onClick}
            >
                {this.props.value}
            </button>
        );
    }
}

class GameHistory extends React.Component {
    render() {
        const gameHistory = this.props.gameHistory || [];
        let games = gameHistory.map((item, index) => {
           return (<li key={index} onClick={() => this.props.onClick(index)}>{index}</li>);
        });
        return (<ul>{games}</ul>);
    };
}

class Board extends React.Component {

    renderSquare(i, bgColor) {
        return (
            <Square key={i}
                bgColor={bgColor}
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)}
            />
        );
    }

    render() {
        let boardRows = [];
        let index = 0;
        for (let i = 0 ; i < 3 ; i++) {
            let columns = [];
            for (let j = 0 ; j < 3 ; j++) {
                let bgColor = this.props.winningPositions && this.props.winningPositions.indexOf(index) !== -1 ? 'red' : '';
                columns.push(this.renderSquare(index, bgColor));
                index++;
            }
            boardRows.push(<div key={i} className="board-row">{columns}</div>);
        }
        return (
            <div>
                {boardRows}
            </div>
        );
    }

}

class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = defaultState();
    }

    reset() {
        this.setState(defaultState());
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        });
    }

    handleGameHistoryClick(i) {
        let game = this.state.gameHistory.history[i];

        this.setState({
            history: game.history,
            stepNumber: game.stepNumber,
            xIsNext: game.xIsNext
        });
    }

    handleMoveHistoryClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? 'X' : 'O';
        this.setState({
            history: history.concat([{
                squares: squares,
                position: i
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        });
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const result = calculateWinner(current.squares);
        const stepNumber = this.state.stepNumber;
        const moves = history.map((step, move) => {
            const desc = move ?
                'Go to move #' + move + ' (position: ' + calculatePosition(step.position) + ')' :
                'Go to game start';
            const maybeBold = (stepNumber === move ? 'bold' : '');
            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)} className={maybeBold}>{desc}</button>
                </li>
            );
        });
        let gameHistory = this.state.gameHistory;
        let status;
        if (result) {
            status = 'Winner: ' + result.winner;
            store.set("gameHistory", JSON.stringify({history: (gameHistory.history ? gameHistory.history : []).concat([this.state])}));
        } else if (this.state.history.length === 10) {
            status = 'Draw';
        } else {
            status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
        }

        const winningPositions = result && result.winningPositions;
        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={current.squares}
                        winningPositions={winningPositions}
                        onClick={(i) => this.handleMoveHistoryClick(i)}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <ol>
                        <li>
                            <button onClick={() => this.reset()}>Reset</button>
                        </li>
                        {moves}
                    </ol>
                </div>
                <div>
                    <GameHistory gameHistory={gameHistory.history} onClick={(i) => this.handleGameHistoryClick(i)}/>
                </div>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return {winner: squares[a], winningPositions: lines[i]};
        }
    }
    return null;
}

function calculatePosition(i) {
    switch (i) {
        case 0: return 'row : 0, col 0';
        case 1: return 'row : 0, col 1';
        case 2: return 'row : 0, col 2';
        case 3: return 'row : 1, col 0';
        case 4: return 'row : 1, col 1';
        case 5: return 'row : 1, col 2';
        case 6: return 'row : 2, col 0';
        case 7: return 'row : 2, col 1';
        case 8: return 'row : 2, col 2';
        default: return 'error';
    }
}

function defaultState() {
    if (window && store && !store.get("gameHistory")) {
        store.set("gameHistory", JSON.stringify({history: null}));
    }
    return {
        history: [{
            squares: Array(9).fill(null),
            position: null
        }],
        stepNumber: 0,
        xIsNext: true,
        gameHistory: JSON.parse(store.getItem("gameHistory"))
    };
}
