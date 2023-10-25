# ID card signing integration using TrustLynx services and LVRTC e-paraksts browser plugin
### Requirements
- LVRTC e-paraksts browser plugin should be installed: https://developers.eparaksts.lv/docs/browser-extensionplugin-integration-guidelines
- Read LVRTC e-paraksts browser plugin tech details: https://developers.eparaksts.lv/docs/client-side-browser-plugin-extension
- TrustLynx services should be deployed and available (at least container and archive services).

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
### Step 3 - Call TrustLynx dmss-container-and-signature-service API for hash generation
Call **dmss-container-and-signature-services** API based on a document type you prefer to sign (.PDF / .ASICE container)

For PDF
```
/api/signing/ic/pdf/{id}/generateHash
```
For ASICE container
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

formdata.append("certInHex", "");
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
