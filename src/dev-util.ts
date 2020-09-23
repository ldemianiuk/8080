
function msbintoieee(msbin: number[]): number[] {
    let buffer = new ArrayBuffer(4);
    let ieee = new Uint8Array(buffer);

   /* MS Binary Format                         */
   /* byte order =>    m3 | m2 | m1 | exponent */
   /* m1 is most significant byte => sbbb|bbbb */
   /* m3 is the least significant byte         */
   /*      m = mantissa byte                   */
   /*      s = sign bit                        */
   /*      b = bit                             */

   let sign = msbin[2] & 0x80;      /* 1000|0000b  */
                                               
   /* IEEE Single Precision Float Format       */
   /*    m3        m2        m1     exponent   */
   /* mmmm|mmmm mmmm|mmmm emmm|mmmm seee|eeee  */
   /*          s = sign bit                    */
   /*          e = exponent bit                */
   /*          m = mantissa bit                */

   for (let i=0; i<4; i++) ieee[i] = 0;
 
   /* any msbin w/ exponent of zero = zero */
   if (msbin[3] == 0) return [0];
   
   ieee[3] |= sign;

   /* MBF is bias 128 and IEEE is bias 127. ALSO, MBF places   */
   /* the decimal point before the assumed bit, while          */
   /* IEEE places the decimal point after the assumed bit.     */

   let ieee_exp = msbin[3] - 2;    /* actually, msbin[3]-1-128+127 */

   /* the first 7 bits of the exponent in ieee[3] */
   ieee[3] |= ieee_exp >> 1;   

   /* the one remaining bit in first bin of ieee[2] */
   ieee[2] |= ieee_exp << 7;   

   /* 0111|1111b : mask out the msbin sign bit */
   ieee[2] |= msbin[2] & 0x7f;

   ieee[1] = msbin[1];
   ieee[0] = msbin[0];

   let view = new DataView(buffer);

   return [view.getFloat32(0, true)];
   }
   


function parity(result: number): boolean {
    let parity = 1;
    for (let i = 0; i < 8; i++) {
        if ((result & (1 << i)) !== 0) {
            parity++;
        }
    }
    return (parity & 1) === 1;
}
