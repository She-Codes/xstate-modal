import 'bootstrap/dist/css/bootstrap.css';
import $ from 'jquery';
import 'popper.js';
import 'bootstrap';
import { Machine, interpret } from 'xstate';

const commentContainer = document.getElementById('comment');
const modalFooter = document.getElementById('modalFooter');

const renderCommentContent = (context, event) => {
  commentContainer.innerHTML = context.comment;
  modalFooter.innerHTML = `
  <button
    type="button"
    class="btn btn-secondary"
    data-dismiss="modal"
  >
    Close
  </button>
  <button type="button" id="editButton" class="btn btn-primary">
    Edit
  </button>
  `;
};

const renderEditContent = context => {
  commentContainer.innerHTML = `
  <form action="" id="commentForm">
    <input type="text" value="${context.comment}" class="form-control" />
  </form>
  `;
  modalFooter.innerHTML = `
  <button
    type="button"
    class="btn btn-secondary"
    data-dismiss="modal"
  >
    Close
  </button>
  <button
    type="button"
    id="cancelButton"
    class="btn btn-secondary"
  >
    Cancel
  </button>
  <button type="button" id="saveButton" class="btn btn-primary">
    Save
  </button>
  `;
};

const getRandomBoolean = () => {
  const num = Math.floor(Math.random() * 2); // return 1 or 0;
  return Boolean(num);
};

const handleLoading = () => {
  // disable input
  // add an overlay with a loader in it
  // remove cancel button
  // blank out buttons
};

const handleError = (context, event) => {
  renderCommentContent(context);
  commentContainer.insertAdjacentHTML(
    'afterbegin',
    `<p>${event.message}</p>`
  );
};

const handleSuccess = (context, event) => {
  renderCommentContent(context);
  commentContainer.insertAdjacentHTML(
    'afterbegin',
    `<p>${event.message}</p>`
  );
};

const simulateHTTPRequest = async () => {
  const fakeFetch = new Promise((resolve, reject) => {
    let timer = setTimeout(() => {
      clearTimeout(timer);
      // return resolve or reject randomly
      if (getRandomBoolean()) {
        resolve('Success!');
      } else {
        reject(new Error('Big Fail!'));
      }
    }, 3000);
  });

  try {
    const message = await fakeFetch;
    console.log(message);
    commentModalService.send('SUCCESS', { message });
  } catch (error) {
    console.log(error.message);
    commentModalService.send('ERROR', { message: error.message });
  }
};

const openChildStates = {
  initial: 'notEditing',
  states: {
    notEditing: {
      on: {
        EDIT: {
          target: 'editing',
          actions: renderEditContent
        }
      }
    },
    editing: {
      on: {
        CANCEL: {
          target: 'notEditing',
          actions: renderCommentContent
        },
        SAVE: {
          target: 'updating',
          actions: simulateHTTPRequest
        }
      }
    },
    updating: {
      // need entry action here
      entry: handleLoading,
      on: {
        SUCCESS: {
          target: 'notEditing',
          actions: handleSuccess
        }, // send success with message?
        ERROR: {
          target: 'notEditing',
          actions: handleError
        },
        CLOSE: undefined, // closing modal while updating not allowed
        CANCEL: undefined // canceling edit while updating not allowed
      }
    }
  }
};

const commentModalMachine = Machine({
  id: 'commentModal',
  initial: 'closed',
  context: {
    comment: 'This is a comment'
  },
  states: {
    closed: {
      on: {
        OPEN: {
          target: 'open',
          actions: renderCommentContent
        }
      }
    },
    open: {
      ...openChildStates
    }
  },
  on: {
    CLOSE: 'closed'
  }
});

const commentModalService = interpret(
  commentModalMachine
).onTransition(state => {
  console.log(state.value, state.event);
});

commentModalService.start();

const clickHandler = e => {
  const target = e.target;
  const editButton = target.closest('#editButton');
  const cancelButton = target.closest('#cancelButton');
  const saveButton = target.closest('#saveButton');

  if (editButton) {
    commentModalService.send('EDIT');
  }

  if (cancelButton) {
    commentModalService.send('CANCEL');
  }

  if (saveButton) {
    commentModalService.send('SAVE');
  }
};

$('#commentModal').on('show.bs.modal', function(e) {
  commentModalService.send('OPEN');
});

$('#commentModal').on('hide.bs.modal', function(e) {
  console.log(e);
  commentModalService.send('CLOSE');
});

document.addEventListener('click', clickHandler);
