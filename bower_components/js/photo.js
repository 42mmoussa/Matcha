function readURL(input) {
	if (input.files && input.files[0]) {
		file = input.files[0];
		fileType = file['type'];
		validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
		if (validImageTypes.includes(fileType)) {
			var reader = new FileReader();

			photo = document.getElementById("previewUpload");
			imageUpload = document.getElementById("imageUpload");
			reader.onload = function (e) {
				photo.setAttribute('src', e.target.result);
				photo.setAttribute('width', '400');
				photo.setAttribute('height', '300');
				photo.style.display = "block";
				imageUpload.style.display = "none";
			};
			reader.readAsDataURL(input.files[0]);
		}
		else {
			alert("Please upload an image .JPG .JPEG or .PNG !");
			document.location.reload(true);
		}
	}
}
