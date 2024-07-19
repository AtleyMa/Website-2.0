const forms = document.querySelectorAll('.needs-validation')
const emailInput = document.getElementById('email-in');
const confirmEmailInput = document.getElementById('confirm-email');
const passInput = document.getElementById('pass-in');
const confirmPassInput = document.getElementById('pass-confirm');

Array.from(forms).forEach(form => {
  form.addEventListener('submit', event => {
    if (confirmEmailInput.value != emailInput.value) {
      confirmEmailInput.setCustomValidity("Emails don't match");
    } 
    else {
      confirmEmailInput.setCustomValidity('');
    }
    if (confirmPassInput.value != passInput.value) {
      confirmPassInput.setCustomValidity("Passwords don't match");
    } 
    else {
      confirmPassInput.setCustomValidity('');
    }

    if (!form.checkValidity()) {
      event.preventDefault()
      event.stopPropagation()
    }
    form.classList.add('was-validated');
  }, false)

  emailInput.addEventListener('input', () => {
    if (confirmEmailInput.value != emailInput.value) {
      confirmEmailInput.setCustomValidity("Emails don't match");
    } else {
      confirmEmailInput.setCustomValidity('');
    }
  });

  confirmEmailInput.addEventListener('input', () => {
    if (confirmEmailInput.value != emailInput.value) {
      confirmEmailInput.setCustomValidity("Emails don't match");
    } else {
      confirmEmailInput.setCustomValidity('');
    }
  });

  passInput.addEventListener('input', () => {
    if (confirmPassInput.value != passInput.value) {
      confirmPassInput.setCustomValidity("Passwords don't match");
    } else {
      confirmPassInput.setCustomValidity('');
    }
  });

  confirmPassInput.addEventListener('input', () => {
    if (confirmPassInput.value != passInput.value) {
      confirmPassInput.setCustomValidity("Passwords don't match");
    } else {
      confirmPassInput.setCustomValidity('');
    }
  });
})

  $('#togglePassword1').click(function() {
    event.preventDefault();
    var passInput = $('#pass-in');
    var type = passInput.attr('type') === 'password' ? 'text' : 'password';
    passInput.attr('type', type);
  
    $(this).html(type === 'text'
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z"/></svg>');
  })

  $('#togglePassword2').click(function() {
    event.preventDefault();
    var passInput = $('#pass-confirm');
    var type = passInput.attr('type') === 'password' ? 'text' : 'password';
    passInput.attr('type', type);
  
    $(this).html(type === 'text'
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z"/></svg>');
  })