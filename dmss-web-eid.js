function webEidAuthenticate(country, eidSSLEnabled) {

    const authUrl = document.querySelector("#web-eid-auth-url").value;
    const lang = document.querySelector("#web-eid-form-lang").value;

    $.get({
        url: authUrl,
        success: function (challenge) {
            import('./web-eid.js').then(module => {
                module.authenticate(challenge.nonce, {lang})
                    .then(authToken => {
						console.log(challenge.sessionCode);
                        const postData = {
							"unverifiedCertificate": authToken.unverifiedCertificate,
						    "signature": authToken.signature,
						    "algorithm": authToken.algorithm,
						    "format": authToken.format
						};
						
						$.ajax({
							type: 'POST',
							url: $('#returnUrl').val() + challenge.sessionCode,
							data: JSON.stringify(postData),
							contentType: 'application/json',
							success: function(response) {
								console.log(JSON.stringify(response));
							},
							error: function() {
								alert('POST request failed.');
							}
						});
                    })
                    .catch(err => {
                        webEidErrorDialog(err.constructor.name, country, eidSSLEnabled);
                    });
                });
            },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            webEidErrorDialog('auth-provider', country, eidSSLEnabled);
        }
    })
}

function webEidErrorDialog(errorCode, country, eidSSLEnabled) {
    if (errorCode === 'ExtensionUnavailableError') {
        console.log('web-eid extension unavailable, can be installed from https://web-eid.eu/');
        console.log(eidSSLEnabled);
        if (eidSSLEnabled == 'true') {
            openPopup('eId-popup', country, eidSSLEnabled);
        } else {
            openPopup('webEid-error-popup', country, eidSSLEnabled);
            $('#web-eid-extension-unavailable').show();
        }
    } else if(errorCode !== 'UserCancelledError') {
        openPopup('webEid-error-popup', country);
        if(errorCode === 'ActionPendingError') {
            $('#web-eid-action-pending').show();
        } else {
            $('#web-eid-general-error').show();
        }
    }
}
