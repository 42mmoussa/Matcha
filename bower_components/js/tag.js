[].forEach.call(document.getElementsByClassName('tags-input'), function (el) {
	let hiddenInput = document.createElement('input'),
		mainInput = document.createElement('input'),
		tags = [];
	
	hiddenInput.setAttribute('type', 'hidden');
	hiddenInput.setAttribute('name', el.getAttribute('data-name'));

	mainInput.setAttribute('type', 'text');
	mainInput.classList.add('main-input');
	mainInput.addEventListener('input', function () {
		let enteredTags = mainInput.value.split(' ');
		if (enteredTags.length > 1) {
			enteredTags.forEach(function (t) {
				let filteredTag = filterTag(t);
				if (filteredTag.length > 0)
				{
					tagOk = insert(filteredTag, "#");
					addTag(tagOk);
				}
			});
			mainInput.value = '';
		}
	});
	refreshTags();

	insert = function insert(main_string, ins_string, pos) {
		if(typeof(pos) == "undefined") {
			pos = 0;
		}
		if(typeof(ins_string) == "undefined") {
			ins_string = '';
		}
		return main_string.slice(0, pos) + ins_string + main_string.slice(pos);
	}

	saveT = document.getElementsByClassName("save");
	for(var i = 0; i < saveT.length; i++){
		let test = {
			text: saveT[i].innerHTML,
			element: document.getElementsByClassName("tag")[i],
		};

		console.log(test.element);
		let closeBtn = document.createElement('span');
		closeBtn.classList.add('close');
		closeBtn.addEventListener('click', function () {
			removeTag(tags.indexOf(test));
		});
		test.element.appendChild(closeBtn);
		tags.push(test);
		refreshTags();
	}

	mainInput.addEventListener('keydown', function (e) {
		let keyCode = e.which || e.keyCode;
		if (keyCode === 8 && mainInput.value.length === 0 && tags.length > 0) {
			removeTag(tags.length - 1);
		}
	});

	el.appendChild(mainInput);
	el.appendChild(hiddenInput);

	function addTag (text) {
		let tag = {
			text: text,
			element: document.createElement('span'),
		};

		tag.element.classList.add('tag');
		tag.element.textContent = tag.text;

		let closeBtn = document.createElement('span');
		closeBtn.classList.add('close');
		closeBtn.addEventListener('click', function () {
			removeTag(tags.indexOf(tag));
		});
		tag.element.appendChild(closeBtn);

		tags.push(tag);

		el.insertBefore(tag.element, mainInput);

		refreshTags();
	}

	function removeTag (index) {
		let tag = tags[index];
		tags.splice(index, 1);
		el.removeChild(tag.element);
		refreshTags();
	}

	function refreshTags () {
		let tagsList = [];
		tags.forEach(function (t) {
			tagsList.push(t.text);
		});
		hiddenInput.value = tagsList.join(',');
	}

	function filterTag (tag) {
		return tag.replace(/[^\w -]/g, '').trim().replace(/\W+/g, '-');
	}
});
