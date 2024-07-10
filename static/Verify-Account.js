const inputs = document.querySelectorAll('.verification-form input');

inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        if (!/^[0-9]$/.test(value)) {
            e.target.value = ''; // Clear the input if it doesn't match the pattern
            return;
        }

        if (value.length === 1) {
            if (index < inputs.length - 1) {
                inputs[index + 1].focus(); // Move to the next input
            }
        }
    });
});