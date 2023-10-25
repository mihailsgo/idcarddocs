# ID card signing integration using TrustLynx services and LVRTC e-paraksts browser plugin
### Requirements
- LVRTC e-paraksts browser plugin should be installed: https://developers.eparaksts.lv/docs/browser-extensionplugin-integration-guidelines
- Read LVRTC e-paraksts browser plugin tech details: https://developers.eparaksts.lv/docs/client-side-browser-plugin-extension
- TrustLynx services should be deployed and available (at least container and archive services).
- Instructions assume that you have already added document into archive.

### Step 1 - Prepare client side environment, install browser plugin
Add to your project client side plugins required by LVRTC e-paraksts plugin (libraries could be found inside this repository):
```
  <script src="eparaksts-hwcrypto-legacy.js"></script>
  <script src="eparaksts-hwcrypto.js"></script>
  <script src="eparaksts-jquery.js"></script>
```
You could follow example here: https://github.com/open-eid-lv/eparaksts-token-signing/blob/master/hwcrypto/demo/sign.html
### Step 2 - Recieve client certificate using e-paraksts plugin
```  
window.eparakstshwcrypto.getCertificate({ lang: 'en' })
    .then(function (certificate) {
        //now you have access to
        //certificate - client certificate
        //certificate.hex - client certificate hex
});
```
Value of **certificate.hex** will be used in step 3.
### Step 3 - Call TrustLynx dmss-container-and-signature-service API for hash generation
Call **dmss-container-and-signature-services** API based on a document type you prefer to sign (.PDF / .ASICE container)

For PDF ([API schema](https://developer.signingservices.io/api/dmss-container-and-signature-services#tag/id-card-sign-controller/operation/generateHashForPDFExistingEndpoint))
```
/api/signing/ic/pdf/{id}/generateHash
```
For ASICE container ([API schema](https://developer.trustlynx.com/api/dmss-container-and-signature-services#tag/id-card-sign-controller/operation/generateHashForExistingEndpoint)) 
```
/api/signing/ic/container/{id}/generateHash
```
JS fetch-based example
```
var formdata = new FormData();
var containerServiceAPI = 'https://[YOUR_DOMAIN]:8092/api/'; //dmss-container-and-signature-service api URL
var documentIdInArchive = 'XXXXXX'; //document ID in archive dmss-archive-services
var isDocumentPDF = false; //for PDF and container API address is a bit different
var apiPath = (isDocumentPDF) ? 'pdf' : 'container'; //based on a document type API path is adjusted
var certHex = "XXXXX"; //certificate hex value from Step 2

formdata.append("certInHex", certHex);
formdata.append("signatureProfile", "LT");

var requestOptions = {
  method: 'POST',
  body: formdata
};

fetch(containerServiceAPI + "signing/ic/" + apiPath + "/" + documentIdInArchive + "/generateHash", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```
In result you will find value **sessionCode** that would be used in step 5.

### Step 4 -  Getting signature using eparakstshwcrypto.sign
```
window.eparakstshwcrypto
.sign(
  certificate, {
    type: 'SHA-1',
    hex: data.hex
}, { lang: 'en' })
.then(function(signature) {
    //signature - signature
    //signature.hex - signature in hex
}, function(error) {
});
```  
Recieved value **signature.hex** will be used in step 5.
### Step 5 - Call TrustLynx dmss-container-and-signature-service API for signing finalisation

For PDF ([API schema](https://developer.signingservices.io/api/dmss-container-and-signature-services#tag/id-card-sign-controller/operation/signPDF_3))
```
/api/signing/ic/pdf/{sessionId}/sign
```
For ASICE container ([Api schema](https://developer.signingservices.io/api/dmss-container-and-signature-services#tag/id-card-sign-controller/operation/signContainer_4)) 
```
/api/signing/ic/container/{sessionId}/sign
```
JS fetch-based example
```
var formdata = new FormData();
var signatureInHex = "XXXXXX"; //signature.hex value from step 4
var sessionCode = "YYYYYY"; //sessionCode value from step 3
var isDocumentPDF = false; //for PDF and container API address is a bit different
var apiPath = (isDocumentPDF) ? 'pdf' : 'container'; //based on a document type API path is adjusted
var containerServiceAPI = 'https://[YOUR_DOMAIN]:8092/api/'; //dmss-container-and-signature-service api URL

formdata.append("signatureInHex", signatureInHex);

var requestOptions = {
  method: 'POST',
  body: formdata
};

fetch(containerServiceAPI + "signing/ic/" + apiPath + "/" + sessionCode  + "/sign", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```
In result string you could overview the result of signing procedure. For instance
```
"result": "SIGNING_COMPLETED"
```

&copy; [TrustLynx](https://trustlynx.com)

