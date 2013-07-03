(function($) {
	var defaults = {
		filesAdded: function (param) {},
		sendVars: function (param) {},
		uploading: function (param) {},
		finished: function (param) {},
		mode: 1
	};

	var vars = {
		total: 0,
		uploaded: 0,
		uploadedPercent: 0,
		numberDone: 0,

		isSending: null,
		isReady: null,
		isProcessing: null,

		files: []
	};

	$.fn.upload = function (options) {
		var settings = $.extend(true, {}, defaults, options);

		return this.each(function (i, base) {
			vars.isReady = true;
			vars.isSending = false;
			vars.isProcessing = false;

			base.init = function () {
				var that = $(this);

				$(this).find('[type="file"]').change(function () {
					var files = [];

					for (var i = 0; i < $(this)[0].files.length; i++) {
						vars.total += $(this)[0].files[i].size;
						var obj = {index: vars.files.length, file: $(this)[0].files[i], inputName: $(this).attr('name')};
						files.push(obj);
						vars.files.push(obj);
					}

					$(that).trigger('filesAdded', {added: files, all: vars.files});
					settings.filesAdded.call(that, {added: files, all: vars.files});
				});

				$(this).submit(function (e) {
					e.preventDefault();
					if (settings.mode === 1) {
						for (var i = 0; i < vars.files.length; i++) {
							(function sendFile (file) {
								if (vars.isSending === false) {
									base.sendFile(file);
								} else {
									setTimeout(sendFile, 100, file);
								}
							})(vars.files[i]);
						}
						return;
					} else if (settings.mode === 2) {
						for (var i = 0; i < vars.files.length; i++) {
							(function sendFile (file) {
								if (vars.isReady === true) {
									base.sendFile(file);
								} else {
									setTimeout(sendFile, 100, file);
								}
							})(vars.files[i]);
						}
					} else {
						for (var i = 0; i < vars.files.length; i++) {
							base.sendFile(vars.files[i]);
						}
					}
					return false;
				});
			};

			base.sendVars = function () {
				$(this).trigger('varsReception', vars);
			}

			base.reset = function () {
				vars = {
					total: 0,
					uploaded: 0,
					uploadedPercent: 0,
					numberDone: 0,

					isSending: null,
					isReady: null,
					isProcessing: null,

					files: []
				};
			}

			base.sendFile = function (file) {
				var that = $(this);

				vars.isReady = false;
				vars.isSending = true;
				vars.isProcessing = false;

				var thisUploaded = 0;
				var fd = new FormData();
				fd.append('index', file.index);
				$(this).find('input').each(function () {
					if ($(this).attr('name') !== undefined) {
						fd.append($(this).attr('name'), $(this).val());
					}
				});
				fd.append(file.inputName, file.file, file.file.name);

				$.ajax({
					xhr: function () {
						var req = $.ajaxSettings.xhr();
						if (req) {
							req.upload.addEventListener('progress', function (event) {
								if (event.lengthComputable) {
									vars.uploaded += (event.loaded - thisUploaded);
									if (event.loaded === event.total) {
										vars.isSending = false;
										vars.isProcessing = true;
										vars.uploaded -= (event.loaded - file.file.size);
									}
									vars.uploadedPercent = Math.round(vars.uploaded * (100 / vars.total));
									vars.files[file.index].uploaded = event.loaded;
									vars.files[file.index].uploadedPercent = Math.round(event.loaded * (100 / event.total));

									$(that).trigger('uploading', [vars, file.index, event, settings]);

									thisUploaded = event.loaded;
								}
							}, false);
						}
						return req;
					},
					url: $(that).attr('action'),
					type: $(that).attr('method'),
					data: fd,
					cache: false,
					processData: false,
					contentType: false
				}).always(function (data) {
					vars.files[file.index].result = data;
					vars.numberDone++;
					vars.isReady = true;
					vars.isProcessing = false;
					$(that).trigger('finished', [vars, file.index]);
				});
			};

			base.init();
		});
	};
})(jQuery);
