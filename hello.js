let arr = ['a', 'b', 'c'];

for (let i = 0; i < 3; i++) {
	if (arr[i]  === 'b')
		arr[i] = 3;
}

console.log(arr);